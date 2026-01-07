"""
Utility for hashing JD text to detect changes
"""
import hashlib

def hash_jd(jd_text: str) -> str:
    """
    Create a hash of the JD text for cache validation
    
    Args:
        jd_text: Job description text
        
    Returns:
        SHA256 hash of the JD text
    """
    if not jd_text:
        return ""
    
    # Normalize: strip whitespace, lowercase
    normalized = jd_text.strip().lower()
    
    # Create hash
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

def jd_changed(jd_text: str, cached_hash: str) -> bool:
    """
    Check if JD has changed since last analysis
    
    Args:
        jd_text: Current JD text
        cached_hash: Previously stored hash
        
    Returns:
        True if JD has changed, False otherwise
    """
    current_hash = hash_jd(jd_text)
    return current_hash != cached_hash
