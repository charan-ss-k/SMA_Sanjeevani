from database import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('users')
print('Columns in users table:')
for col in columns:
    print(f'  - {col["name"]}: {col["type"]}')
