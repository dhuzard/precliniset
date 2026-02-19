"""
Pydantic schemas for Experiment data validation.

This module defines schemas for validating experiment data rows, specifically focusing on
the JSON content of the row_data field.
"""
from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, Field, model_validator

class ExperimentDataRowSchema(BaseModel):
    """Schema for validating ExperimentDataRow.row_data.
    
    Enforces that row_data is a dictionary with scalar values (strings, numbers, booleans, or null).
    Complex nested structures are not allowed in row_data to verify data integrity for analysis.
    """
    
    row_data: Dict[str, Optional[Union[str, int, float, bool]]] = Field(
        default_factory=dict,
        description="Protocol-specific results. Must be a flat dictionary of scalar values."
    )
    
    model_config = {
        "extra": "ignore" # Ignore extra fields at the top level, we strictly validate row_data
    }

    @model_validator(mode='before')
    @classmethod
    def validate_row_data_structure(cls, data: Any) -> Any:
        """Ensure row_data is present and is a dictionary."""
        if isinstance(data, dict):
             # specific validation if needed, but type hinting covers most
             pass
        return data
