"""
Payment Service for Stripe and Razorpay Integration
Handles subscription creation, payment processing, and webhook handling
"""
import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import stripe
import razorpay
from supabase_config import supabase_admin

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# Initialize Razorpay
razorpay_client = None
if os.getenv("RAZORPAY_KEY_ID") and os.getenv("RAZORPAY_KEY_SECRET"):
    razorpay_client = razorpay.Client(
        auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
    )


class PaymentService:
    """Service for handling payments via Stripe and Razorpay"""
    
    def __init__(self):
        self.stripe_enabled = bool(os.getenv("STRIPE_SECRET_KEY"))
        self.razorpay_enabled = razorpay_client is not None
    
    def get_available_providers(self) -> list:
        """Get list of available payment providers"""
        providers = []
        if self.stripe_enabled:
            providers.append("stripe")
        if self.razorpay_enabled:
            providers.append("razorpay")
        return providers
    
    # ============================================================================
    # STRIPE METHODS
    # ============================================================================
    
    def create_stripe_checkout_session(
        self,
        tenant_id: str,
        plan_id: str,
        success_url: str,
        cancel_url: str,
        customer_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a Stripe checkout session for subscription"""
        try:
            # Get plan details from database
            plan_response = supabase_admin.table('subscription_plans').select('*').eq('id', plan_id).single().execute()
            plan = plan_response.data
            
            if not plan:
                raise ValueError(f"Plan {plan_id} not found")
            
            # Get or create Stripe customer
            customer_id = self._get_or_create_stripe_customer(tenant_id, customer_email)
            
            # Determine price ID based on interval
            price_id = None
            if plan.get('interval') == 'year' and plan.get('stripe_price_id_yearly'):
                price_id = plan['stripe_price_id_yearly']
            elif plan.get('stripe_price_id_monthly'):
                price_id = plan['stripe_price_id_monthly']
            
            if not price_id:
                raise ValueError(f"Stripe price ID not configured for plan {plan_id}")
            
            # Determine payment methods based on customer location
            # For India: Enable UPI, cards, wallets
            # For others: Enable cards, Apple Pay, Google Pay, etc.
            payment_method_types = ['card']  # Default: cards always supported
            
            # Add UPI for Indian customers (detect from email domain or pass as param)
            # You can enhance this by detecting customer location
            # For now, we'll enable common payment methods
            # In production, detect customer country and enable accordingly
            
            # Create checkout session with multiple payment methods
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=payment_method_types,
                # Enable automatic payment methods (includes UPI, wallets, etc.)
                payment_method_options={
                    'card': {
                        'request_three_d_secure': 'automatic',
                    },
                },
                # Enable UPI for Indian customers (auto-detected by Stripe)
                # Stripe automatically shows UPI if customer is in India
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'tenant_id': tenant_id,
                    'plan_id': plan_id,
                },
                subscription_data={
                    'metadata': {
                        'tenant_id': tenant_id,
                        'plan_id': plan_id,
                    }
                }
            )
            
            return {
                'session_id': session.id,
                'url': session.url,
                'provider': 'stripe'
            }
        except Exception as e:
            logger.error(f"Error creating Stripe checkout session: {e}")
            raise
    
    def _get_or_create_stripe_customer(self, tenant_id: str, email: Optional[str] = None) -> str:
        """Get or create a Stripe customer for tenant"""
        try:
            # Check if customer already exists in metadata
            customers = stripe.Customer.list(limit=100, metadata={'tenant_id': tenant_id})
            if customers.data:
                return customers.data[0].id
            
            # Create new customer
            customer = stripe.Customer.create(
                email=email,
                metadata={'tenant_id': tenant_id}
            )
            return customer.id
        except Exception as e:
            logger.error(f"Error getting/creating Stripe customer: {e}")
            raise
    
    def handle_stripe_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, webhook_secret
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise
        
        event_type = event['type']
        data = event['data']['object']
        
        logger.info(f"Received Stripe webhook: {event_type}")
        
        if event_type == 'checkout.session.completed':
            return self._handle_stripe_checkout_completed(data)
        elif event_type == 'customer.subscription.created':
            return self._handle_stripe_subscription_created(data)
        elif event_type == 'customer.subscription.updated':
            return self._handle_stripe_subscription_updated(data)
        elif event_type == 'customer.subscription.deleted':
            return self._handle_stripe_subscription_deleted(data)
        elif event_type == 'invoice.payment_succeeded':
            return self._handle_stripe_payment_succeeded(data)
        elif event_type == 'invoice.payment_failed':
            return self._handle_stripe_payment_failed(data)
        else:
            logger.info(f"Unhandled event type: {event_type}")
            return {'status': 'ignored', 'event_type': event_type}
    
    def _handle_stripe_checkout_completed(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful checkout completion"""
        metadata = session.get('metadata', {})
        tenant_id = metadata.get('tenant_id')
        subscription_id = session.get('subscription')
        
        if not tenant_id or not subscription_id:
            logger.error("Missing tenant_id or subscription_id in checkout session")
            return {'status': 'error', 'message': 'Missing required data'}
        
        # Get subscription details from Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Create or update subscription in database
        self._sync_stripe_subscription(subscription, tenant_id)
        
        return {'status': 'success', 'subscription_id': subscription_id}
    
    def _handle_stripe_subscription_created(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle new subscription creation"""
        metadata = subscription.get('metadata', {})
        tenant_id = metadata.get('tenant_id')
        
        if tenant_id:
            self._sync_stripe_subscription(subscription, tenant_id)
        
        return {'status': 'success'}
    
    def _handle_stripe_subscription_updated(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription updates"""
        metadata = subscription.get('metadata', {})
        tenant_id = metadata.get('tenant_id')
        
        if tenant_id:
            self._sync_stripe_subscription(subscription, tenant_id)
        
        return {'status': 'success'}
    
    def _handle_stripe_subscription_deleted(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription cancellation"""
        metadata = subscription.get('metadata', {})
        tenant_id = metadata.get('tenant_id')
        stripe_sub_id = subscription.get('id')
        
        if tenant_id and stripe_sub_id:
            # Update subscription status in database
            supabase_admin.table('subscriptions').update({
                'status': 'canceled',
                'canceled_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }).eq('stripe_subscription_id', stripe_sub_id).execute()
            
            # Update tenant subscription status
            supabase_admin.table('tenants').update({
                'subscription_status': 'canceled'
            }).eq('id', tenant_id).execute()
        
        return {'status': 'success'}
    
    def _handle_stripe_payment_succeeded(self, invoice: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful payment"""
        subscription_id = invoice.get('subscription')
        if not subscription_id:
            return {'status': 'ignored'}
        
        # Get subscription from database
        sub_response = supabase_admin.table('subscriptions').select('*').eq('stripe_subscription_id', subscription_id).single().execute()
        if not sub_response.data:
            return {'status': 'ignored'}
        
        subscription = sub_response.data
        tenant_id = subscription['tenant_id']
        
        # Create payment record
        supabase_admin.table('payments').insert({
            'subscription_id': subscription['id'],
            'tenant_id': tenant_id,
            'stripe_payment_intent_id': invoice.get('payment_intent'),
            'stripe_charge_id': invoice.get('charge'),
            'amount': invoice.get('amount_paid', 0),
            'currency': invoice.get('currency', 'usd'),
            'status': 'succeeded',
            'customer_email': invoice.get('customer_email'),
            'metadata': {'invoice_id': invoice.get('id')}
        }).execute()
        
        return {'status': 'success'}
    
    def _handle_stripe_payment_failed(self, invoice: Dict[str, Any]) -> Dict[str, Any]:
        """Handle failed payment"""
        subscription_id = invoice.get('subscription')
        if not subscription_id:
            return {'status': 'ignored'}
        
        # Update subscription status
        supabase_admin.table('subscriptions').update({
            'status': 'past_due',
            'updated_at': datetime.utcnow().isoformat()
        }).eq('stripe_subscription_id', subscription_id).execute()
        
        return {'status': 'success'}
    
    def _sync_stripe_subscription(self, subscription: Dict[str, Any], tenant_id: str):
        """Sync Stripe subscription to database"""
        try:
            stripe_sub_id = subscription.get('id')
            plan_metadata = subscription.get('metadata', {})
            plan_id = plan_metadata.get('plan_id')
            
            # Get current period
            current_period_start = datetime.fromtimestamp(subscription.get('current_period_start', 0))
            current_period_end = datetime.fromtimestamp(subscription.get('current_period_end', 0))
            
            # Determine status
            status_map = {
                'active': 'active',
                'trialing': 'trialing',
                'past_due': 'past_due',
                'canceled': 'canceled',
                'unpaid': 'unpaid'
            }
            status = status_map.get(subscription.get('status'), 'active')
            
            # Check if subscription exists
            existing = supabase_admin.table('subscriptions').select('id').eq('stripe_subscription_id', stripe_sub_id).execute()
            
            subscription_data = {
                'tenant_id': tenant_id,
                'plan_id': plan_id,
                'stripe_subscription_id': stripe_sub_id,
                'status': status,
                'current_period_start': current_period_start.isoformat(),
                'current_period_end': current_period_end.isoformat(),
                'cancel_at_period_end': subscription.get('cancel_at_period_end', False),
                'payment_provider': 'stripe',
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if existing.data:
                # Update existing
                supabase_admin.table('subscriptions').update(subscription_data).eq('id', existing.data[0]['id']).execute()
            else:
                # Create new
                subscription_data['created_at'] = datetime.utcnow().isoformat()
                result = supabase_admin.table('subscriptions').insert(subscription_data).execute()
                subscription_id = result.data[0]['id'] if result.data else None
                
                # Update tenant
                if subscription_id:
                    supabase_admin.table('tenants').update({
                        'current_subscription_id': subscription_id,
                        'subscription_status': status
                    }).eq('id', tenant_id).execute()
        except Exception as e:
            logger.error(f"Error syncing Stripe subscription: {e}")
            raise
    
    # ============================================================================
    # RAZORPAY METHODS
    # ============================================================================
    
    def create_razorpay_subscription(
        self,
        tenant_id: str,
        plan_id: str,
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a Razorpay subscription"""
        if not razorpay_client:
            raise ValueError("Razorpay not configured")
        
        try:
            # Get plan details
            plan_response = supabase_admin.table('subscription_plans').select('*').eq('id', plan_id).single().execute()
            plan = plan_response.data
            
            if not plan:
                raise ValueError(f"Plan {plan_id} not found")
            
            # Get or create Razorpay customer
            customer_id = self._get_or_create_razorpay_customer(tenant_id, customer_email, customer_name)
            
            # Get Razorpay plan ID
            razorpay_plan_id = None
            if plan.get('interval') == 'year' and plan.get('razorpay_plan_id_yearly'):
                razorpay_plan_id = plan['razorpay_plan_id_yearly']
            elif plan.get('razorpay_plan_id_monthly'):
                razorpay_plan_id = plan['razorpay_plan_id_monthly']
            
            if not razorpay_plan_id:
                raise ValueError(f"Razorpay plan ID not configured for plan {plan_id}")
            
            # Create subscription
            subscription = razorpay_client.subscription.create({
                'plan_id': razorpay_plan_id,
                'customer_notify': 1,
                'total_count': 12,  # 12 months
                'notes': {
                    'tenant_id': tenant_id,
                    'plan_id': plan_id
                }
            })
            
            return {
                'subscription_id': subscription['id'],
                'short_url': subscription.get('short_url'),
                'provider': 'razorpay'
            }
        except Exception as e:
            logger.error(f"Error creating Razorpay subscription: {e}")
            raise
    
    def _get_or_create_razorpay_customer(
        self,
        tenant_id: str,
        email: Optional[str] = None,
        name: Optional[str] = None
    ) -> str:
        """Get or create Razorpay customer"""
        try:
            # Create customer
            customer = razorpay_client.customer.create({
                'name': name or 'Customer',
                'email': email,
                'notes': {
                    'tenant_id': tenant_id
                }
            })
            return customer['id']
        except Exception as e:
            logger.error(f"Error creating Razorpay customer: {e}")
            raise
    
    def handle_razorpay_webhook(self, payload: Dict[str, Any], signature: str) -> Dict[str, Any]:
        """Handle Razorpay webhook events"""
        webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
        
        try:
            # Verify webhook signature
            razorpay_client.utility.verify_webhook_signature(
                payload.get('payload', {}).get('payment', {}).get('entity', {}).get('id', ''),
                signature,
                webhook_secret
            )
        except Exception as e:
            logger.error(f"Invalid Razorpay webhook signature: {e}")
            raise
        
        event = payload.get('event')
        entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
        
        logger.info(f"Received Razorpay webhook: {event}")
        
        if event == 'subscription.activated':
            return self._handle_razorpay_subscription_activated(entity)
        elif event == 'subscription.charged':
            return self._handle_razorpay_subscription_charged(entity)
        elif event == 'subscription.cancelled':
            return self._handle_razorpay_subscription_cancelled(entity)
        elif event == 'payment.captured':
            return self._handle_razorpay_payment_captured(entity)
        else:
            logger.info(f"Unhandled Razorpay event: {event}")
            return {'status': 'ignored', 'event': event}
    
    def _handle_razorpay_subscription_activated(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Razorpay subscription activation"""
        notes = subscription.get('notes', {})
        tenant_id = notes.get('tenant_id')
        
        if tenant_id:
            # Sync subscription to database
            self._sync_razorpay_subscription(subscription, tenant_id)
        
        return {'status': 'success'}
    
    def _handle_razorpay_subscription_charged(self, charge: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Razorpay subscription charge"""
        # Similar to payment captured
        return self._handle_razorpay_payment_captured(charge)
    
    def _handle_razorpay_subscription_cancelled(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Razorpay subscription cancellation"""
        notes = subscription.get('notes', {})
        tenant_id = notes.get('tenant_id')
        razorpay_sub_id = subscription.get('id')
        
        if tenant_id and razorpay_sub_id:
            supabase_admin.table('subscriptions').update({
                'status': 'canceled',
                'canceled_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }).eq('razorpay_subscription_id', razorpay_sub_id).execute()
            
            supabase_admin.table('tenants').update({
                'subscription_status': 'canceled'
            }).eq('id', tenant_id).execute()
        
        return {'status': 'success'}
    
    def _handle_razorpay_payment_captured(self, payment: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Razorpay payment capture"""
        # Get subscription from payment
        subscription_id = payment.get('subscription_id')
        if not subscription_id:
            return {'status': 'ignored'}
        
        # Get subscription from database
        sub_response = supabase_admin.table('subscriptions').select('*').eq('razorpay_subscription_id', subscription_id).single().execute()
        if not sub_response.data:
            return {'status': 'ignored'}
        
        subscription = sub_response.data
        tenant_id = subscription['tenant_id']
        
        # Create payment record
        supabase_admin.table('payments').insert({
            'subscription_id': subscription['id'],
            'tenant_id': tenant_id,
            'razorpay_payment_id': payment.get('id'),
            'razorpay_order_id': payment.get('order_id'),
            'amount': payment.get('amount', 0),
            'currency': payment.get('currency', 'inr'),
            'status': 'succeeded',
            'payment_method': payment.get('method'),
            'customer_email': payment.get('email'),
            'metadata': {'razorpay_payment': payment}
        }).execute()
        
        return {'status': 'success'}
    
    def _sync_razorpay_subscription(self, subscription: Dict[str, Any], tenant_id: str):
        """Sync Razorpay subscription to database"""
        try:
            razorpay_sub_id = subscription.get('id')
            notes = subscription.get('notes', {})
            plan_id = notes.get('plan_id')
            
            # Determine status
            status_map = {
                'active': 'active',
                'authenticated': 'active',
                'created': 'active',
                'cancelled': 'canceled',
                'halted': 'past_due'
            }
            status = status_map.get(subscription.get('status'), 'active')
            
            # Get current period (Razorpay provides different structure)
            current_period_start = datetime.utcnow()
            current_period_end = datetime.utcnow() + timedelta(days=30)  # Default monthly
            
            # Check if subscription exists
            existing = supabase_admin.table('subscriptions').select('id').eq('razorpay_subscription_id', razorpay_sub_id).execute()
            
            subscription_data = {
                'tenant_id': tenant_id,
                'plan_id': plan_id,
                'razorpay_subscription_id': razorpay_sub_id,
                'status': status,
                'current_period_start': current_period_start.isoformat(),
                'current_period_end': current_period_end.isoformat(),
                'payment_provider': 'razorpay',
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if existing.data:
                supabase_admin.table('subscriptions').update(subscription_data).eq('id', existing.data[0]['id']).execute()
            else:
                subscription_data['created_at'] = datetime.utcnow().isoformat()
                result = supabase_admin.table('subscriptions').insert(subscription_data).execute()
                subscription_id = result.data[0]['id'] if result.data else None
                
                if subscription_id:
                    supabase_admin.table('tenants').update({
                        'current_subscription_id': subscription_id,
                        'subscription_status': status
                    }).eq('id', tenant_id).execute()
        except Exception as e:
            logger.error(f"Error syncing Razorpay subscription: {e}")
            raise
    
    # ============================================================================
    # UTILITY METHODS
    # ============================================================================
    
    def get_subscription_plans(self) -> list:
        """Get all active subscription plans"""
        try:
            response = supabase_admin.table('subscription_plans').select('*').eq('is_active', True).order('display_order').execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching subscription plans: {e}")
            return []
    
    def get_tenant_subscription(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Get current subscription for a tenant"""
        try:
            response = supabase_admin.table('subscriptions').select(
                '*, subscription_plans(*)'
            ).eq('tenant_id', tenant_id).eq('status', 'active').order('created_at', desc=True).limit(1).execute()
            
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching tenant subscription: {e}")
            return None
    
    def cancel_subscription(self, tenant_id: str, cancel_at_period_end: bool = True) -> Dict[str, Any]:
        """Cancel a subscription"""
        try:
            subscription = self.get_tenant_subscription(tenant_id)
            if not subscription:
                return {'status': 'error', 'message': 'No active subscription found'}
            
            provider = subscription.get('payment_provider')
            subscription_id = subscription.get('id')
            
            if provider == 'stripe':
                stripe_sub_id = subscription.get('stripe_subscription_id')
                if stripe_sub_id:
                    if cancel_at_period_end:
                        stripe.Subscription.modify(stripe_sub_id, cancel_at_period_end=True)
                    else:
                        stripe.Subscription.delete(stripe_sub_id)
            
            elif provider == 'razorpay':
                razorpay_sub_id = subscription.get('razorpay_subscription_id')
                if razorpay_sub_id:
                    razorpay_client.subscription.cancel(razorpay_sub_id)
            
            # Update database
            supabase_admin.table('subscriptions').update({
                'cancel_at_period_end': cancel_at_period_end,
                'canceled_at': datetime.utcnow().isoformat() if not cancel_at_period_end else None,
                'status': 'canceled' if not cancel_at_period_end else 'active',
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', subscription_id).execute()
            
            return {'status': 'success', 'cancel_at_period_end': cancel_at_period_end}
        except Exception as e:
            logger.error(f"Error canceling subscription: {e}")
            raise


# Singleton instance
payment_service = PaymentService()

