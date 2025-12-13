"""Simulation runner for testing different candidate profiles"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.core.interview_controller import InterviewController
from typing import Dict, List
import json
from datetime import datetime

# Import candidate profiles
from simulations.candidates import strong_candidate
from simulations.candidates import weak_candidate
from simulations.candidates import mixed_candidate
from simulations.candidates import improving_candidate
from simulations.candidates import declining_candidate

CANDIDATE_PROFILES = {
    "strong": strong_candidate,
    "weak": weak_candidate,
    "mixed": mixed_candidate,
    "improving": improving_candidate,
    "declining": declining_candidate
}

class SimulationRunner:
    """Runs interview simulations with different candidate profiles"""
    
    def __init__(self, candidate_profile: str, language: str = "python"):
        self.candidate_profile = candidate_profile
        self.language = language
        self.controller = InterviewController(language)
        self.profile_module = CANDIDATE_PROFILES.get(candidate_profile)
        
        if not self.profile_module:
            raise ValueError(f"Unknown profile: {candidate_profile}. Available: {list(CANDIDATE_PROFILES.keys())}")
        
        # Reset state for profiles that track it
        if hasattr(self.profile_module, 'reset_state'):
            self.profile_module.reset_state()
    
    def run_simulation(self) -> Dict:
        """Run complete interview simulation"""
        results = {
            "session_id": self.controller.context_manager.session_id,
            "profile": self.candidate_profile,
            "language": self.language,
            "timestamp": datetime.now().isoformat(),
            "questions": [],
            "summary_stats": {
                "total_responses": 0,
                "average_score": 0,
                "score_trend": []
            }
        }
        
        all_scores = []
        
        # Start interview
        print(f"\n{'='*60}")
        print(f"Starting simulation: {self.candidate_profile.upper()} candidate ({self.language})")
        print(f"Session ID: {results['session_id']}")
        print(f"{'='*60}\n")
        
        self.controller.start_interview()
        
        question_num = 0
        # Run through questions
        while not self.controller.is_interview_complete():
            question_num += 1
            # Get question
            question = self.controller.get_next_question()
            if not question:
                break
            
            print(f"Question {question_num}: {question['text'][:80]}...")
            
            question_result = {
                "question_id": question["question_id"],
                "question_text": question["text"],
                "question_type": question.get("question_type", ""),
                "topic": question.get("topic", ""),
                "responses": []
            }
            
            # Get the full question data for response generation
            full_question = self.controller.current_question
            
            # Initial response
            initial_response = self.profile_module.generate_response(full_question, "initial")
            print(f"  Initial: {initial_response[:60]}...")
            
            result = self.controller.process_response(initial_response, "initial")
            score = result["evaluation"].get("overall_score", 0)
            all_scores.append(score)
            print(f"  Score: {score:.1f}")
            
            question_result["responses"].append({
                "type": "initial",
                "response": initial_response,
                "score": score
            })
            
            # Follow-ups
            followup_count = 0
            while result.get("followup") and followup_count < self.controller.followups_per_question:
                followup_count += 1
                followup_text = result["followup"].get("text", "")
                print(f"  Follow-up {followup_count}: {followup_text[:50]}...")
                
                followup_response = self.profile_module.generate_response(full_question, "followup", followup_count)
                print(f"  Response: {followup_response[:60]}...")
                
                result = self.controller.process_response(followup_response, "followup")
                score = result["evaluation"].get("overall_score", 0)
                all_scores.append(score)
                print(f"  Score: {score:.1f}")
                
                question_result["responses"].append({
                    "type": "followup",
                    "followup_number": followup_count,
                    "followup_question": followup_text,
                    "response": followup_response,
                    "score": score
                })
            
            self.controller.complete_round()
            results["questions"].append(question_result)
            print()
        
        # Calculate summary stats
        results["summary_stats"]["total_responses"] = len(all_scores)
        results["summary_stats"]["average_score"] = sum(all_scores) / len(all_scores) if all_scores else 0
        results["summary_stats"]["score_trend"] = all_scores
        results["summary_stats"]["min_score"] = min(all_scores) if all_scores else 0
        results["summary_stats"]["max_score"] = max(all_scores) if all_scores else 0
        
        # Finalize
        final_summary = self.controller.finalize_interview()
        results["final_summary"] = {
            "session_id": final_summary.get("session_id"),
            "completed": True
        }
        
        # Print summary
        print(f"{'='*60}")
        print(f"SIMULATION COMPLETE: {self.candidate_profile.upper()}")
        print(f"{'='*60}")
        print(f"Total Responses: {results['summary_stats']['total_responses']}")
        print(f"Average Score: {results['summary_stats']['average_score']:.1f}")
        print(f"Score Range: {results['summary_stats']['min_score']:.1f} - {results['summary_stats']['max_score']:.1f}")
        print(f"Score Trend: {' -> '.join([f'{s:.0f}' for s in all_scores[:10]])}")
        print(f"{'='*60}\n")
        
        return results
    
    def save_results(self, results: Dict, output_dir: str = "simulations/results") -> str:
        """Save simulation results to file"""
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{output_dir}/{self.candidate_profile}_{self.language}_{timestamp}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"Results saved to: {filename}")
        return filename


def run_all_simulations(language: str = "python") -> Dict:
    """Run simulations for all candidate profiles"""
    all_results = {}
    
    for profile in CANDIDATE_PROFILES.keys():
        try:
            runner = SimulationRunner(profile, language)
            results = runner.run_simulation()
            runner.save_results(results)
            all_results[profile] = {
                "average_score": results["summary_stats"]["average_score"],
                "total_responses": results["summary_stats"]["total_responses"],
                "score_range": f"{results['summary_stats']['min_score']:.1f}-{results['summary_stats']['max_score']:.1f}"
            }
        except Exception as e:
            print(f"Error running {profile} simulation: {e}")
            all_results[profile] = {"error": str(e)}
    
    return all_results


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Run interview simulations")
    parser.add_argument("--profile", "-p", default="all", 
                        help="Candidate profile (strong/weak/mixed/improving/declining/all)")
    parser.add_argument("--language", "-l", default="python",
                        help="Interview language (python/java)")
    args = parser.parse_args()
    
    if args.profile == "all":
        results = run_all_simulations(args.language)
        print("\n" + "="*60)
        print("ALL SIMULATIONS SUMMARY")
        print("="*60)
        for profile, stats in results.items():
            if "error" in stats:
                print(f"{profile:12}: ERROR - {stats['error']}")
            else:
                print(f"{profile:12}: Avg={stats['average_score']:.1f}, Range={stats['score_range']}, N={stats['total_responses']}")
    else:
        runner = SimulationRunner(args.profile, args.language)
        results = runner.run_simulation()
        runner.save_results(results)
