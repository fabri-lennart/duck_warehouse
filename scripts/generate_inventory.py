"""Generate the bundled Parquet inventory without an intermediate format."""

from pathlib import Path

import duckdb


OUTPUT = Path(__file__).resolve().parents[1] / "public" / "data" / "inventory.parquet"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

con = duckdb.connect()
con.execute(
    """
    CREATE TABLE inventory AS
    WITH seed AS (SELECT i, i - 1 AS n FROM range(1, 10001) AS t(i))
    SELECT
      'ID-' || lpad(i::VARCHAR, 5, '0') AS id,
      'SKU-' || lpad(i::VARCHAR, 5, '0') AS sku,
      CASE i WHEN 1 THEN 'Screw' WHEN 2 THEN 'Screwdriver' WHEN 3 THEN 'Hammer' WHEN 4 THEN 'Tape' ELSE (['Screw', 'Screwdriver', 'Cable', 'Helmet', 'Gloves', 'Paint',
        'Hammer', 'Tape', 'Bearing', 'Valve'][(i % 10) + 1]) ||
        ' / Series ' || lpad(((i % 240) + 1)::VARCHAR, 3, '0') END AS name,
      CASE i WHEN 1 THEN 'A' WHEN 2 THEN 'M' WHEN 3 THEN 'G' WHEN 4 THEN 'D' ELSE chr(65 + (n % 26)::INTEGER) END AS aisle,
      CASE i WHEN 1 THEN 1 WHEN 2 THEN 15 WHEN 3 THEN 7 WHEN 4 THEN 10 ELSE ((n // 26) % 15 + 1)::INTEGER END AS rack,
      CASE i WHEN 1 THEN 1 WHEN 2 THEN 1 WHEN 3 THEN 2 WHEN 4 THEN 3 ELSE ((n // 390) % 3 + 1)::INTEGER END AS level,
      ((n // 1170) % 3)::INTEGER AS position
    FROM seed
    """
)
safe_path = OUTPUT.as_posix().replace("'", "''")
con.execute(f"COPY inventory TO '{safe_path}' (FORMAT PARQUET, COMPRESSION ZSTD)")
print(f"Wrote {con.execute('SELECT count(*) FROM inventory').fetchone()[0]:,} rows to {OUTPUT}")
