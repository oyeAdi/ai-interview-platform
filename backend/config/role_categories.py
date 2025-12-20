"""
Role-based category flows and intelligent question selection.

This module defines which question categories are appropriate for each role type,
ensuring that candidates only receive relevant questions (e.g., PM never gets coding).
"""

from typing import Dict, List, Optional

# Role-based category flows
# Each role has:
# - primary_flow: Ordered list of categories to follow
# - optional: Additional categories that can be included
# - excluded: Categories that should NEVER be used for this role

ROLE_CATEGORY_FLOWS = {
    # ============================================================================
    # TECHNICAL ROLES
    # ============================================================================
    
    "software_engineer": {
        "primary_flow": ["conceptual", "coding", "system_design", "problem_solving"],
        "optional": ["behavioral", "algorithms"],
        "excluded": ["product_strategy", "product_sense", "sales_discovery", 
                    "design_thinking", "financial_modeling"]
    },
    
    "devops_engineer": {
        "primary_flow": ["infrastructure", "cicd", "monitoring", "incident_response"],
        "optional": ["coding", "system_design", "behavioral"],
        "excluded": ["product_strategy", "sales_discovery", "design_thinking"]
    },
    
    "data_scientist": {
        "primary_flow": ["statistics", "ml_algorithms", "data_analysis", "coding"],
        "optional": ["system_design", "behavioral"],
        "excluded": ["product_strategy", "sales_discovery", "design_thinking"]
    },
    
    "qa_engineer": {
        "primary_flow": ["test_strategy", "automation", "bug_analysis", "problem_solving"],
        "optional": ["coding", "behavioral"],
        "excluded": ["product_strategy", "sales_discovery", "financial_modeling"]
    },
    
    # ============================================================================
    # PRODUCT ROLES
    # ============================================================================
    
    "product_manager": {
        "primary_flow": ["product_strategy", "product_sense", "metrics_analytics", "execution"],
        "optional": ["behavioral", "technical_depth"],
        "excluded": ["coding", "system_design", "algorithms", "infrastructure"]  # ⭐ NO CODING!
    },
    
    "product_designer": {
        "primary_flow": ["design_thinking", "user_research", "prototyping", "visual_design"],
        "optional": ["portfolio_review", "behavioral"],
        "excluded": ["coding", "system_design", "financial_modeling", "sales_discovery"]
    },
    
    "product_marketing": {
        "primary_flow": ["go_to_market", "positioning", "messaging", "competitive_analysis"],
        "optional": ["product_sense", "behavioral"],
        "excluded": ["coding", "system_design", "design_thinking"]
    },
    
    # ============================================================================
    # BUSINESS ROLES
    # ============================================================================
    
    "sales_representative": {
        "primary_flow": ["discovery", "objection_handling", "closing", "account_management"],
        "optional": ["behavioral", "industry_knowledge"],
        "excluded": ["coding", "system_design", "product_strategy", "design_thinking"]
    },
    
    "business_development": {
        "primary_flow": ["partnership_strategy", "deal_structuring", "market_analysis", "negotiation"],
        "optional": ["sales_discovery", "behavioral"],
        "excluded": ["coding", "system_design", "design_thinking"]
    },
    
    "account_manager": {
        "primary_flow": ["relationship_building", "upselling", "retention", "customer_success"],
        "optional": ["behavioral", "problem_solving"],
        "excluded": ["coding", "system_design", "product_strategy"]
    },
    
    "business_analyst": {
        "primary_flow": ["data_analysis", "requirements_gathering", "stakeholder_management", "process_improvement"],
        "optional": ["sql_queries", "excel_modeling", "behavioral"],
        "excluded": ["coding", "design_thinking"]
    },
    
    # ============================================================================
    # OPERATIONS ROLES
    # ============================================================================
    
    "operations_manager": {
        "primary_flow": ["process_optimization", "resource_planning", "kpi_management", "problem_solving"],
        "optional": ["behavioral", "lean_six_sigma"],
        "excluded": ["coding", "design_thinking", "sales_discovery"]
    },
    
    "supply_chain": {
        "primary_flow": ["logistics", "inventory_management", "vendor_management", "forecasting"],
        "optional": ["data_analysis", "behavioral"],
        "excluded": ["coding", "design_thinking", "product_strategy"]
    },
    
    "project_manager": {
        "primary_flow": ["planning", "risk_management", "stakeholder_communication", "execution"],
        "optional": ["behavioral", "agile_methodologies"],
        "excluded": ["coding", "design_thinking", "sales_discovery"]
    },
    
    # ============================================================================
    # CREATIVE ROLES
    # ============================================================================
    
    "content_writer": {
        "primary_flow": ["writing_sample", "seo_knowledge", "audience_targeting", "editing"],
        "optional": ["portfolio_review", "cms_tools", "behavioral"],
        "excluded": ["coding", "system_design", "financial_modeling", "sales_discovery"]
    },
    
    "graphic_designer": {
        "primary_flow": ["portfolio_review", "design_principles", "tools_proficiency", "visual_design"],
        "optional": ["behavioral", "brand_alignment"],
        "excluded": ["coding", "system_design", "financial_modeling", "sales_discovery"]
    },
    
    "video_editor": {
        "primary_flow": ["portfolio_review", "storytelling", "technical_skills", "editing"],
        "optional": ["behavioral", "tools_proficiency"],
        "excluded": ["coding", "system_design", "financial_modeling", "sales_discovery"]
    },
    
    # ============================================================================
    # FINANCE ROLES
    # ============================================================================
    
    "financial_analyst": {
        "primary_flow": ["financial_modeling", "valuation", "forecasting", "data_analysis"],
        "optional": ["excel_advanced", "sql", "behavioral"],
        "excluded": ["coding", "design_thinking", "product_strategy", "sales_discovery"]
    },
    
    "accountant": {
        "primary_flow": ["gaap", "tax", "reconciliation", "financial_reporting"],
        "optional": ["excel_advanced", "behavioral"],
        "excluded": ["coding", "design_thinking", "product_strategy", "sales_discovery"]
    },
    
    # ============================================================================
    # HR ROLES
    # ============================================================================
    
    "hr_business_partner": {
        "primary_flow": ["talent_strategy", "employee_relations", "change_management", "behavioral"],
        "optional": ["hr_systems", "data_analysis"],
        "excluded": ["coding", "system_design", "sales_discovery", "design_thinking"]
    },
    
    "recruiter": {
        "primary_flow": ["sourcing", "screening", "closing_candidates", "pipeline_management"],
        "optional": ["behavioral", "hr_systems"],
        "excluded": ["coding", "system_design", "product_strategy", "design_thinking"]
    },
    
    # ============================================================================
    # FALLBACK / CUSTOM
    # ============================================================================
    
    "custom_role": {
        "primary_flow": [],  # User-defined
        "optional": [],
        "excluded": []
    }
}


def get_role_config(role_type: str) -> Dict:
    """
    Get configuration for a specific role type.
    
    Args:
        role_type: The role type (e.g., "product_manager", "software_engineer")
    
    Returns:
        Role configuration dict with primary_flow, optional, and excluded categories
    """
    return ROLE_CATEGORY_FLOWS.get(role_type, ROLE_CATEGORY_FLOWS["custom_role"])


def get_excluded_categories(role_type: str) -> List[str]:
    """
    Get list of excluded categories for a role.
    
    Args:
        role_type: The role type
    
    Returns:
        List of category names that should never be used for this role
    """
    config = get_role_config(role_type)
    return config.get("excluded", [])


def get_primary_flow(role_type: str) -> List[str]:
    """
    Get ordered primary flow of categories for a role.
    
    Args:
        role_type: The role type
    
    Returns:
        Ordered list of category names to follow
    """
    config = get_role_config(role_type)
    return config.get("primary_flow", [])


def is_category_allowed(role_type: str, category: str) -> bool:
    """
    Check if a category is allowed for a given role.
    
    Args:
        role_type: The role type
        category: The category name to check
    
    Returns:
        True if category is allowed, False if excluded
    """
    excluded = get_excluded_categories(role_type)
    return category not in excluded


def get_next_category_in_flow(
    role_type: str,
    asked_categories: List[str],
    enabled_categories: Dict[str, dict]
) -> Optional[str]:
    """
    Get next category following the primary flow for this role.
    
    Args:
        role_type: The role type
        asked_categories: List of categories already asked
        enabled_categories: Dict of enabled categories with their configs
    
    Returns:
        Next category name to use, or None if flow complete
    """
    primary_flow = get_primary_flow(role_type)
    
    # Find first category in flow that hasn't been asked and is enabled
    for category in primary_flow:
        if category not in asked_categories and category in enabled_categories:
            # Check if category still has quota
            cat_config = enabled_categories[category]
            if cat_config.get("enabled", False) and cat_config.get("count", 0) > 0:
                return category
    
    return None
