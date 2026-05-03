import re
import math
from xml.sax.saxutils import escape

# Extract Schema
schema_file = 'tmp_models.txt'
entities_attributes = {}
with open(schema_file) as f:
    data = f.read()

exclude_attrs = ['createdAt', 'updatedAt', 'isActive', 'processedById', 'issuedById', 'waivedById']

for match in re.finditer(r'model\s+(\w+)\s+\{(.*?)\}', data, re.DOTALL):
    model_name = match.group(1)
    fields = []
    for line in match.group(2).strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('@@'):
            continue
        parts = line.split()
        if len(parts) >= 2:
            name = parts[0]
            type_info = parts[1]
            if type_info.endswith('[]'):
                continue

            if name in exclude_attrs:
                continue

            is_pk = '@id' in line
            is_fk = '@relation' in line and 'fields: [' in line

            if is_fk:
                continue # We'll just skip the relation property and keep the foreign key scalar field

            if name.endswith('Id') and name != 'id':
                type_type = 'FK'
            elif is_pk:
                type_type = 'PK'
            else:
                type_type = 'ATTR'

            fields.append((name, type_type))
    entities_attributes[model_name] = fields

entities = list(entities_attributes.keys())
weak_entities = ["BillingItem", "PaymentDetail", "Installment", "StudentClass"]

drawio_header = '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net">
  <diagram name="Conceptual EER Diagram" id="kassmpit-eer">
    <mxGraphModel dx="1422" dy="798" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="4000" pageHeight="3000" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />'''

drawio_footer = '''      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''

def add_node(id, value, style, x, y, width, height):
    value_escaped = escape(value)
    return f'        <mxCell id="{id}" value="{value_escaped}" style="{style}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{width}" height="{height}" as="geometry" /></mxCell>\n'

def add_edge(id, source, target, style, value=""):
    value_escaped = escape(value)
    return f'        <mxCell id="{id}" value="{value_escaped}" style="{style}" edge="1" parent="1" source="{source}" target="{target}"><mxGeometry relative="1" as="geometry" /></mxCell>\n'

styles = {
    "entity": "rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;",
    "weak_entity": "shape=ext;margin=3;double=1;whiteSpace=wrap;html=1;align=center;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;",
    "attribute": "ellipse;whiteSpace=wrap;html=1;align=center;fontStyle=0;",
    "pk_attribute": "ellipse;whiteSpace=wrap;html=1;align=center;fontStyle=4;",
    "fk_attribute": "ellipse;whiteSpace=wrap;html=1;align=center;fontStyle=0;",
    "derived_attribute": "ellipse;whiteSpace=wrap;html=1;align=center;dashed=1;",
    "relationship": "rhombus;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;",
    "weak_relationship": "rhombus;whiteSpace=wrap;html=1;double=1;fillColor=#e1d5e7;strokeColor=#9673a6;",
    "isa": "triangle;whiteSpace=wrap;html=1;direction=north;fillColor=#fff2cc;strokeColor=#d6b656;",
    "line": "endArrow=none;html=1;rounded=0;strokeColor=#000000;"
}

nodes_xml = ""
node_id = 100

layout = {
    "User": (1800, 200),
    "ISA_User": (1800, 350),
    "Admin": (1000, 500),
    "Headmaster": (1400, 500),
    "Treasurer": (1800, 500),
    "Student": (2200, 500),
    "NewStudent": (2600, 500),

    "Rel_Student_Class": (2200, 800), # Not really needed if StudentClass is entity
    "Class": (1800, 800),
    "AcademicYear": (1000, 800),
    "StudentClass": (2600, 800),

    "BillingTemplate": (1000, 1100),
    "BillingItem": (1000, 1400),

    "Rel_Billing_Student": (2200, 1100),
    "Billing": (2200, 1400),
    "Installment": (1800, 1400),

    "Payment": (2600, 1400),
    "PaymentDetail": (3000, 1400),

    "Expense": (1000, 1700),
    "ExpenseCategoryOption": (1000, 2000),

    "CashLedgerEntry": (1800, 1700),
    "ActivityLog": (2600, 1700),
    "NotificationLog": (3000, 1700),

    "NewStudentTransaction": (3000, 500),
    "SystemSettings": (3000, 800),
    "IncomeCategoryOption": (3000, 2000)
}

entity_id_map = {}

def distribute_attributes(entity_name, pos_x, pos_y, attributes, e_width=120, e_height=60, radius=160):
    global node_id, nodes_xml
    n = len(attributes)
    if n == 0: return

    for i, attr in enumerate(attributes):
        name, atype = attr

        label = name
        if atype == 'FK':
            label += " (FK)"

        angle = (2 * math.pi * i) / n
        attr_x = pos_x + e_width/2 + radius * math.cos(angle) - 40
        attr_y = pos_y + e_height/2 + radius * math.sin(angle) - 20

        node_id += 1
        attr_id = node_id

        style = styles["pk_attribute"] if atype == 'PK' else styles["attribute"]
        nodes_xml += add_node(f"node_{attr_id}", label, style, attr_x, attr_y, 80, 40)
        nodes_xml += add_edge(f"edge_{attr_id}", f"node_{entity_id_map[entity_name]}", f"node_{attr_id}", styles["line"])

for entity, pos in layout.items():
    if "ISA_" in entity or "Rel_" in entity:
        continue
    node_id += 1
    entity_id_map[entity] = node_id

    style = styles["weak_entity"] if entity in weak_entities else styles["entity"]

    nodes_xml += add_node(f"node_{node_id}", entity, style, pos[0], pos[1], 120, 60)

    if entity in entities_attributes:
        distribute_attributes(entity, pos[0], pos[1], entities_attributes[entity])

isa_id = node_id + 100
nodes_xml += add_node(f"node_{isa_id}", "ISA", styles["isa"], layout["ISA_User"][0]+40, layout["ISA_User"][1], 40, 40)
nodes_xml += add_edge(f"edge_isa_user", f"node_{isa_id}", f"node_{entity_id_map['User']}", styles["line"])

for role in ["Admin", "Headmaster", "Treasurer", "Student", "NewStudent"]:
    nodes_xml += add_edge(f"edge_isa_{role}", f"node_{entity_id_map[role]}", f"node_{isa_id}", styles["line"])

relationships = [
    # Academic Year relations (user requested explicitly)
    ("kelas tahun ajaran", "AcademicYear", "StudentClass", "1:N", (1800, 650)),
    ("tagihan tahun ajaran", "AcademicYear", "Billing", "1:N", (1600, 1100)),
    ("template tahun ajaran", "AcademicYear", "BillingTemplate", "1:N", (1000, 950)),
    ("registrasi tahun ajaran", "AcademicYear", "NewStudent", "1:N", (1800, 550)),

    # Class relations
    ("memiliki kelas", "Student", "StudentClass", "1:N", (2400, 650)),
    ("detail kelas", "Class", "StudentClass", "1:N", (2200, 800)),
    ("memiliki template", "Class", "BillingTemplate", "1:N", (1400, 950)),

    # Billing Template & Item
    ("berisi item", "BillingTemplate", "BillingItem", "1:N", (1000, 1250)),

    # Billing, Student, Payment, Installment
    ("memiliki tagihan", "Student", "Billing", "1:N", (2200, 950)),
    ("membayar", "Billing", "Payment", "1:N", (2400, 1400)),
    ("memiliki cicilan", "Billing", "Installment", "1:N", (2000, 1400)),
    ("memiliki detail", "Payment", "PaymentDetail", "1:N", (2800, 1400)),
    ("menghasilkan kas", "Payment", "CashLedgerEntry", "1:1", (2200, 1550)),

    # User, Logs, Expenses
    ("membuat pengeluaran", "User", "Expense", "1:N", (1400, 1350)),
    ("memiliki kategori", "Expense", "ExpenseCategoryOption", "1:N", (1000, 1850)),
    ("mencatat log", "User", "ActivityLog", "1:N", (2200, 1350)),
    ("menerima notif", "User", "NotificationLog", "1:N", (2400, 1350)),

    # New Student
    ("transaksi pendaftaran", "NewStudent", "NewStudentTransaction", "1:N", (2800, 500))
]

rel_idx = 1
for rel in relationships:
    name, e1, e2, card, pos = rel
    rel_id = node_id + 500 + rel_idx
    rel_idx += 1

    style = styles["weak_relationship"] if e2 in weak_entities else styles["relationship"]

    nodes_xml += add_node(f"node_{rel_id}", name, style, pos[0], pos[1], 120, 50)

    if e1 in entity_id_map:
        nodes_xml += add_edge(f"edge_rel_{rel_id}_e1", f"node_{entity_id_map[e1]}", f"node_{rel_id}", styles["line"], value="1" if card.startswith("1") else "M")
    if e2 in entity_id_map:
        nodes_xml += add_edge(f"edge_rel_{rel_id}_e2", f"node_{rel_id}", f"node_{entity_id_map[e2]}", styles["line"], value="1" if card.endswith("1") else "N")

with open('docs/ERD-KASSMPIT-Chen-Indo.drawio', 'w') as f:
    f.write(drawio_header + "\n" + nodes_xml + drawio_footer)

print("EER Diagram generated successfully at docs/ERD-KASSMPIT-Chen-Indo.drawio")
