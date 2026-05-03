import re
from xml.sax.saxutils import escape

entities = [
    "User", "Student", "NewStudent", "NewStudentTransaction",
    "Expense", "ExpenseCategoryOption", "IncomeCategoryOption",
    "CashLedgerEntry", "SystemSettings", "NotificationLog",
    "AcademicYear", "Class", "StudentClass", "BillingTemplate",
    "Billing", "Payment", "ActivityLog", "BillingItem", "PaymentDetail", "Installment"
]

weak_entities = ["BillingItem", "PaymentDetail", "Installment"]

drawio_header = '''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net">
  <diagram name="Conceptual EER Diagram" id="kassmpit-eer">
    <mxGraphModel dx="1422" dy="798" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3000" pageHeight="2000" math="0" shadow="0">
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
    "derived_attribute": "ellipse;whiteSpace=wrap;html=1;align=center;dashed=1;",
    "relationship": "rhombus;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;",
    "weak_relationship": "rhombus;whiteSpace=wrap;html=1;double=1;fillColor=#e1d5e7;strokeColor=#9673a6;",
    "isa": "triangle;whiteSpace=wrap;html=1;direction=north;fillColor=#fff2cc;strokeColor=#d6b656;",
    "line": "endArrow=none;html=1;rounded=0;strokeColor=#000000;"
}

nodes_xml = ""
node_id = 100

layout = {
    "User": (600, 100),
    "ISA_User": (600, 200),
    "Admin": (200, 300),
    "Headmaster": (400, 300),
    "Treasurer": (600, 300),
    "Student": (800, 300),
    "NewStudent": (1000, 300),

    "Rel_Student_Class": (800, 450),
    "Class": (600, 450),
    "AcademicYear": (400, 450),
    "StudentClass": (1000, 450),

    "BillingTemplate": (200, 600),
    "BillingItem": (200, 750),

    "Rel_Billing_Student": (800, 600),
    "Billing": (800, 750),
    "Installment": (600, 750),

    "Payment": (1000, 750),
    "PaymentDetail": (1200, 750),

    "Expense": (200, 900),
    "ExpenseCategoryOption": (200, 1050),

    "CashLedgerEntry": (600, 900),
    "ActivityLog": (1000, 900),
    "NotificationLog": (1200, 900),

    "NewStudentTransaction": (1200, 300),
    "SystemSettings": (1400, 300),
    "IncomeCategoryOption": (1400, 900)
}

entity_id_map = {}

for entity, pos in layout.items():
    if "ISA_" in entity or "Rel_" in entity:
        continue
    node_id += 1
    entity_id_map[entity] = node_id

    style = styles["weak_entity"] if entity in weak_entities else styles["entity"]

    nodes_xml += add_node(f"node_{node_id}", entity, style, pos[0], pos[1], 120, 60)

    # Attributes
    attr_id_1 = node_id + 1000
    nodes_xml += add_node(f"node_{attr_id_1}", "id", styles["pk_attribute"], pos[0]-20, pos[1]-50, 60, 40)
    nodes_xml += add_edge(f"edge_{attr_id_1}", f"node_{node_id}", f"node_{attr_id_1}", styles["line"])

    # Custom attributes based on Indonesian memory requirement
    if entity == "User":
        attr_id_2 = node_id + 2000
        nodes_xml += add_node(f"node_{attr_id_2}", "peran (role)", styles["attribute"], pos[0]+80, pos[1]-50, 80, 40)
        nodes_xml += add_edge(f"edge_{attr_id_2}", f"node_{node_id}", f"node_{attr_id_2}", styles["line"])
    elif entity == "Billing":
        attr_id_3 = node_id + 3000
        nodes_xml += add_node(f"node_{attr_id_3}", "total_bayar", styles["derived_attribute"], pos[0]+80, pos[1]-50, 80, 40)
        nodes_xml += add_edge(f"edge_{attr_id_3}", f"node_{node_id}", f"node_{attr_id_3}", styles["line"])


isa_id = node_id + 100
nodes_xml += add_node(f"node_{isa_id}", "ISA", styles["isa"], layout["ISA_User"][0]+40, layout["ISA_User"][1], 40, 40)
nodes_xml += add_edge(f"edge_isa_user", f"node_{isa_id}", f"node_{entity_id_map['User']}", styles["line"])

for role in ["Admin", "Headmaster", "Treasurer", "Student", "NewStudent"]:
    nodes_xml += add_edge(f"edge_isa_{role}", f"node_{entity_id_map[role]}", f"node_{isa_id}", styles["line"])

relationships = [
    ("mendaftar", "Student", "Class", "M:N", layout["Rel_Student_Class"]),
    ("memiliki template", "Class", "BillingTemplate", "1:N", (400, 525)),
    ("berisi item", "BillingTemplate", "BillingItem", "1:N", (200, 675)),
    ("memiliki tagihan", "Student", "Billing", "1:N", layout["Rel_Billing_Student"]),
    ("membayar", "Billing", "Payment", "1:N", (900, 750)),
    ("memiliki cicilan", "Billing", "Installment", "1:N", (700, 750)),
    ("memiliki detail", "Payment", "PaymentDetail", "1:N", (1100, 750)),
    ("membuat", "User", "Expense", "1:N", (400, 600)),
    ("memiliki kategori", "Expense", "ExpenseCategoryOption", "1:N", (200, 975)),
    ("mencatat log", "User", "ActivityLog", "1:N", (1000, 600)),
    ("menerima notif", "User", "NotificationLog", "1:N", (1200, 600)),
    ("menghasilkan kas", "Payment", "CashLedgerEntry", "1:1", (800, 825)),
    ("tahun ajaran", "Class", "AcademicYear", "N:1", (500, 450)),
    ("transaksi", "NewStudent", "NewStudentTransaction", "1:N", (1100, 300))
]

rel_idx = 1
for rel in relationships:
    name, e1, e2, card, pos = rel
    rel_id = node_id + 500 + rel_idx
    rel_idx += 1

    style = styles["weak_relationship"] if e2 in weak_entities else styles["relationship"]

    nodes_xml += add_node(f"node_{rel_id}", name, style, pos[0], pos[1], 120, 50)

    if e1 in entity_id_map:
        # Edge with cardinality
        nodes_xml += add_edge(f"edge_rel_{rel_id}_e1", f"node_{entity_id_map[e1]}", f"node_{rel_id}", styles["line"], value="1" if card.startswith("1") else "M")
    if e2 in entity_id_map:
        nodes_xml += add_edge(f"edge_rel_{rel_id}_e2", f"node_{rel_id}", f"node_{entity_id_map[e2]}", styles["line"], value="1" if card.endswith("1") else "N")

# Aggregation representation - draw a bounding box around Student, Rel_Student_Class, Class
# Actually, Chen's aggregation is a rectangle around the relationship.
# We'll just add a big dashed rectangle around the enrollment relationship to represent the StudentClass entity conceptually.
agg_id = node_id + 900
nodes_xml += add_node(f"node_{agg_id}", "", "rounded=0;whiteSpace=wrap;html=1;dashed=1;fillColor=none;strokeColor=#000000;", 550, 400, 350, 150)
# We need to ensure the aggregation box is behind other elements, but Draw.io XML order matters.
# It's fine for now, we just prepend it.
nodes_xml = f'        <mxCell id="node_{agg_id}" value="" style="rounded=0;whiteSpace=wrap;html=1;dashed=1;fillColor=none;strokeColor=#000000;" vertex="1" parent="1"><mxGeometry x="550" y="400" width="350" height="150" as="geometry" /></mxCell>\n' + nodes_xml


with open('docs/ERD-KASSMPIT-Chen-Indo.drawio', 'w') as f:
    f.write(drawio_header + "\n" + nodes_xml + drawio_footer)

print("EER Diagram generated successfully at docs/ERD-KASSMPIT-Chen-Indo.drawio")
