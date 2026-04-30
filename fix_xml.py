import xml.dom.minidom

# Baca file
with open('docs/ERD-KASSMPIT-Chen-Indo.drawio', 'r') as f:
    xml_string = f.read()

# Format menjadi pretty XML
dom = xml.dom.minidom.parseString(xml_string)
pretty_xml = dom.toprettyxml(indent="  ")

# Tulis ulang
with open('docs/ERD-KASSMPIT-Chen-Indo.drawio', 'w') as f:
    f.write(pretty_xml)
print("File dipercantik!")
