
import pytest
from pydantic import ValidationError
from datetime import date
from app.schemas.animal import AnimalSchema
from app.schemas.experiment import ExperimentDataRowSchema

def test_animal_schema_measurements_validation():
    """Test AnimalSchema measurements validation."""
    
    # Valid Case
    valid_data = {
        "uid": "A001",
        "display_id": "Mouse-1",
        "date_of_birth": date(2023, 1, 1),
        "measurements": {
            "weight": 25.5,
            "tumor_volume": 100,
            "notes": "Healthy",
            "last_weight": 26.0,
            "death_date": "2023-12-31"
        }
    }
    animal = AnimalSchema(**valid_data)
    assert animal.measurements['weight'] == 25.5
    assert animal.measurements['notes'] == "Healthy"

    # Invalid Case: Nested Dictionary
    invalid_nested = valid_data.copy()
    invalid_nested['measurements'] = {"nested": {"key": "value"}}
    with pytest.raises(ValidationError) as excinfo:
        AnimalSchema(**invalid_nested)
    assert "Only scalar values allowed" in str(excinfo.value)

    # Invalid Case: Bad Date Format
    invalid_date = valid_data.copy()
    invalid_date['measurements'] = {"death_date": "31-12-2023"} # Wrong format
    with pytest.raises(ValidationError) as excinfo:
        AnimalSchema(**invalid_date)
    assert "Invalid death_date format" in str(excinfo.value)

    # Invalid Case: Bad Weight
    invalid_weight = valid_data.copy()
    invalid_weight['measurements'] = {"last_weight": "heavy"}
    with pytest.raises(ValidationError) as excinfo:
        AnimalSchema(**invalid_weight)
    assert "Invalid last_weight" in str(excinfo.value)


def test_experiment_datarow_schema_validation():
    """Test ExperimentDataRowSchema row_data validation."""
    
    # Valid Case
    valid_data = {
        "row_data": {
            "col1": 10,
            "col2": "Result",
            "col3": 12.5,
            "col4": True,
            "col5": None
        }
    }
    row = ExperimentDataRowSchema(**valid_data)
    assert row.row_data['col1'] == 10

    # Invalid Case: Nested Dictionary (Standard Pydantic should catch this due to type hint)
    # But because Dict[str, Union...] includes Dict if not careful, we rely on Pydantic's strictness 
    # or the fact that Union[str, int, float, bool] does NOT include Dict.
    invalid_nested = {
        "row_data": {
            "col1": {"nested": "value"}
        }
    }
    with pytest.raises(ValidationError) as excinfo:
        ExperimentDataRowSchema(**invalid_nested)
    # Pydantic error message for Union failure
    assert "Input should be a valid string" in str(excinfo.value) or "Input should be a valid integer" in str(excinfo.value)

