"""
Dynamic payment calculator for CodeCollab tasks
Calculates micropayments based on complexity, quality, and execution time
"""

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class PaymentCalculator:
    """Calculate dynamic micropayments for AI-completed coding tasks"""

    # Base pricing by complexity (in dollars)
    BASE_PRICING = {
        "simple": 0.03,      # Simple algorithms, basic functions
        "medium": 0.08,      # Multi-function implementations, moderate logic
        "complex": 0.20,     # Complex architectures, multiple files
        "unknown": 0.05      # Default fallback
    }

    # Quality multipliers (applied to base price)
    QUALITY_MULTIPLIERS = {
        "excellent": 1.3,    # 95-100: +30% bonus
        "good": 1.15,        # 85-94: +15% bonus
        "acceptable": 1.0,   # 70-84: No adjustment
        "needs_work": 0.8    # <70: -20% (shouldn't happen with escalation)
    }

    # Execution time bonuses (for fast completion)
    TIME_BONUS = {
        "very_fast": 1.1,    # <30s: +10% speed bonus
        "fast": 1.05,        # 30-60s: +5% bonus
        "normal": 1.0,       # 60-120s: No adjustment
        "slow": 0.95         # >120s: -5% (encourage optimization)
    }

    # Token cost adjustment (approximate API costs)
    TOKEN_COST_PER_1K = 0.0001  # $0.0001 per 1K tokens (rough estimate)

    @classmethod
    def calculate_payment(
        cls,
        complexity: str = "unknown",
        quality_score: int = 85,
        execution_time_ms: int = 0,
        tokens_used: int = 0,
        code_lines: int = 0
    ) -> Dict[str, Any]:
        """
        Calculate dynamic micropayment for task completion

        Args:
            complexity: Task complexity (simple/medium/complex)
            quality_score: Quality score 0-100
            execution_time_ms: Execution time in milliseconds
            tokens_used: Total tokens used by LLM
            code_lines: Number of lines of code generated

        Returns:
            Dict with payment amount and breakdown
        """
        # Get base price by complexity
        complexity_lower = complexity.lower() if complexity else "unknown"
        base_price = cls.BASE_PRICING.get(complexity_lower, cls.BASE_PRICING["unknown"])

        # Get quality multiplier
        quality_tier = cls._get_quality_tier(quality_score)
        quality_multiplier = cls.QUALITY_MULTIPLIERS[quality_tier]

        # Get time bonus/penalty
        execution_time_sec = execution_time_ms / 1000.0 if execution_time_ms > 0 else 0
        time_tier = cls._get_time_tier(execution_time_sec)
        time_multiplier = cls.TIME_BONUS[time_tier]

        # Calculate token cost (actual API usage cost)
        token_cost = (tokens_used / 1000.0) * cls.TOKEN_COST_PER_1K if tokens_used > 0 else 0

        # Calculate final payment
        # Formula: (base_price × quality × time) + token_cost
        adjusted_price = base_price * quality_multiplier * time_multiplier
        final_payment = adjusted_price + token_cost

        # Round to nearest cent
        final_payment = round(final_payment, 2)

        # Minimum payment of $0.01
        final_payment = max(0.01, final_payment)

        logger.info(
            f"Payment calculation: complexity={complexity}, quality={quality_score}, "
            f"time={execution_time_sec:.1f}s, tokens={tokens_used}, "
            f"payment=${final_payment:.2f}"
        )

        return {
            "amount": final_payment,
            "currency": "USD",
            "breakdown": {
                "base_price": base_price,
                "complexity": complexity_lower,
                "quality_score": quality_score,
                "quality_tier": quality_tier,
                "quality_multiplier": quality_multiplier,
                "execution_time_sec": round(execution_time_sec, 2),
                "time_tier": time_tier,
                "time_multiplier": time_multiplier,
                "token_cost": round(token_cost, 4),
                "tokens_used": tokens_used,
                "code_lines": code_lines
            }
        }

    @staticmethod
    def _get_quality_tier(score: int) -> str:
        """Determine quality tier from score"""
        if score >= 95:
            return "excellent"
        elif score >= 85:
            return "good"
        elif score >= 70:
            return "acceptable"
        else:
            return "needs_work"

    @staticmethod
    def _get_time_tier(execution_time_sec: float) -> str:
        """Determine time tier from execution time"""
        if execution_time_sec < 30:
            return "very_fast"
        elif execution_time_sec < 60:
            return "fast"
        elif execution_time_sec <= 120:
            return "normal"
        else:
            return "slow"

    @classmethod
    def format_payment_summary(cls, payment_info: Dict[str, Any]) -> str:
        """
        Format payment information for display

        Args:
            payment_info: Payment info dict from calculate_payment()

        Returns:
            Formatted payment summary string
        """
        amount = payment_info["amount"]
        breakdown = payment_info["breakdown"]

        summary = f"Payment: ${amount:.2f}\n"
        summary += f"  Base ({breakdown['complexity']}): ${breakdown['base_price']:.2f}\n"
        summary += f"  Quality bonus ({breakdown['quality_tier']}): ×{breakdown['quality_multiplier']}\n"
        summary += f"  Speed bonus ({breakdown['time_tier']}): ×{breakdown['time_multiplier']}\n"

        if breakdown['token_cost'] > 0:
            summary += f"  Token cost ({breakdown['tokens_used']:,} tokens): +${breakdown['token_cost']:.4f}\n"

        return summary


# Convenience function for quick calculations
def calculate_task_payment(
    complexity: str = "unknown",
    quality_score: int = 85,
    execution_time_ms: int = 0,
    tokens_used: int = 0,
    code_lines: int = 0
) -> Dict[str, Any]:
    """Convenience wrapper for PaymentCalculator.calculate_payment()"""
    return PaymentCalculator.calculate_payment(
        complexity=complexity,
        quality_score=quality_score,
        execution_time_ms=execution_time_ms,
        tokens_used=tokens_used,
        code_lines=code_lines
    )
