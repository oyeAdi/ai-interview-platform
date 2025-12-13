"""Candidate profile modules for interview simulation"""
from . import strong_candidate
from . import weak_candidate
from . import mixed_candidate
from . import improving_candidate
from . import declining_candidate

__all__ = [
    'strong_candidate',
    'weak_candidate', 
    'mixed_candidate',
    'improving_candidate',
    'declining_candidate'
]
