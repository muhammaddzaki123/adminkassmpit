import re

with open('docs/ERD-KASSMPIT-Chen-Indo.drawio', 'r') as f:
    content = f.read()

# Encode < and > inside labels if any exist, although we mostly avoided it.
# Check if the XML is valid. It looks like valid XML.
# Let's save it cleanly just in case.
import xml.etree.ElementTree as ET
try:
    tree = ET.parse('docs/ERD-KASSMPIT-Chen-Indo.drawio')
    print("XML is valid.")
except ET.ParseError as e:
    print(f"XML Parse error: {e}")
