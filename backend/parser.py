"""
CSV and SQL schema parsing logic.
Extracts column names, inferred types, and sample values from uploaded data.
"""

import io
import re
import pandas as pd
import sqlparse


def infer_dtype_label(series: pd.Series) -> str:
    """Map pandas dtype to a human-readable type label."""
    dtype = series.dtype
    if pd.api.types.is_bool_dtype(dtype):
        return "Boolean"
    if pd.api.types.is_integer_dtype(dtype):
        return "Integer"
    if pd.api.types.is_float_dtype(dtype):
        return "Float"
    if pd.api.types.is_datetime64_any_dtype(dtype):
        return "DateTime"
    # Check if string column might be dates
    if dtype == object:
        sample = series.dropna().head(5)
        try:
            pd.to_datetime(sample)
            return "DateTime"
        except (ValueError, TypeError):
            pass
        # Check if it's boolean-like
        unique_vals = set(sample.astype(str).str.lower())
        if unique_vals.issubset({"true", "false", "yes", "no", "0", "1", "t", "f"}):
            return "Boolean"
    return "String"


def parse_csv(file_content: bytes, filename: str = "uploaded.csv") -> dict:
    """
    Parse a CSV file and extract column metadata.

    Returns:
        {
            "schema_name": str,
            "columns": [
                {
                    "column_name": str,
                    "inferred_type": str,
                    "sample_values": list
                }
            ]
        }
    """
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise ValueError("CSV file is empty")

    columns = []
    for col in df.columns:
        sample_values = df[col].dropna().head(5).tolist()
        # Convert to native Python types for JSON serialization
        sample_values = [
            str(v) if not isinstance(v, (int, float, bool)) else v
            for v in sample_values
        ]

        columns.append({
            "column_name": str(col).strip(),
            "inferred_type": infer_dtype_label(df[col]),
            "sample_values": sample_values,
        })

    schema_name = filename.rsplit(".", 1)[0] if "." in filename else filename

    return {
        "schema_name": schema_name,
        "columns": columns,
    }


def parse_sql(sql_text: str) -> dict:
    """
    Parse a SQL CREATE TABLE statement and extract column metadata.

    Returns:
        {
            "schema_name": str,
            "columns": [
                {
                    "column_name": str,
                    "inferred_type": str,
                    "sample_values": []
                }
            ]
        }
    """
    if not sql_text or not sql_text.strip():
        raise ValueError("SQL schema text is empty")

    # Normalize the SQL text
    sql_text = sql_text.strip()

    # Extract table name
    table_match = re.search(
        r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"\[]?(\w+)[`"\]]?',
        sql_text,
        re.IGNORECASE,
    )
    schema_name = table_match.group(1) if table_match else "unknown_table"

    # Extract the content between parentheses
    paren_match = re.search(r'\((.*)\)', sql_text, re.DOTALL)
    if not paren_match:
        raise ValueError("Could not find column definitions in the SQL schema")

    columns_text = paren_match.group(1)

    # Split by commas, but be careful with nested parentheses
    columns = []
    depth = 0
    current = []
    for char in columns_text:
        if char == '(':
            depth += 1
            current.append(char)
        elif char == ')':
            depth -= 1
            current.append(char)
        elif char == ',' and depth == 0:
            columns.append(''.join(current).strip())
            current = []
        else:
            current.append(char)
    if current:
        columns.append(''.join(current).strip())

    # Parse each column definition
    result_columns = []
    skip_keywords = {
        'PRIMARY', 'FOREIGN', 'UNIQUE', 'INDEX', 'KEY',
        'CONSTRAINT', 'CHECK', 'REFERENCES',
    }

    for col_def in columns:
        col_def = col_def.strip()
        if not col_def:
            continue

        # Skip constraint definitions
        first_word = col_def.split()[0].upper().strip('`"[]')
        if first_word in skip_keywords:
            continue

        # Extract column name and type
        col_match = re.match(
            r'[`"\[]?(\w+)[`"\]]?\s+(\w[\w\s()]*?)(?:\s+(?:NOT|NULL|DEFAULT|PRIMARY|UNIQUE|AUTO|REFERENCES|CHECK|CONSTRAINT).*)?$',
            col_def,
            re.IGNORECASE,
        )

        if col_match:
            col_name = col_match.group(1)
            col_type = col_match.group(2).strip()

            # Map SQL types to readable labels
            type_upper = col_type.upper()
            if any(t in type_upper for t in ['INT', 'SERIAL', 'BIGINT', 'SMALLINT']):
                inferred = "Integer"
            elif any(t in type_upper for t in ['FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'REAL']):
                inferred = "Float"
            elif any(t in type_upper for t in ['BOOL']):
                inferred = "Boolean"
            elif any(t in type_upper for t in ['DATE', 'TIME', 'TIMESTAMP']):
                inferred = "DateTime"
            elif any(t in type_upper for t in ['UUID']):
                inferred = "UUID"
            elif any(t in type_upper for t in ['JSON', 'JSONB']):
                inferred = "JSON"
            elif any(t in type_upper for t in ['TEXT', 'VARCHAR', 'CHAR', 'STRING']):
                inferred = "String"
            else:
                inferred = col_type

            result_columns.append({
                "column_name": col_name,
                "inferred_type": inferred,
                "sample_values": [],
            })

    if not result_columns:
        raise ValueError("No columns could be extracted from the SQL schema")

    return {
        "schema_name": schema_name,
        "columns": result_columns,
    }
