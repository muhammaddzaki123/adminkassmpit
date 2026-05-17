import xml.etree.ElementTree as ET
import os

def escape_xml(text):
    if not isinstance(text, str):
        return text
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")

NODE_WIDTH = 200
NODE_HEIGHT = 70
X_SPACING = 100
Y_SPACING = 30

class SitemapGenerator:
    def __init__(self, color, file_name):
        self.color = color
        self.file_name = file_name

        self.colors = {
            'Admin': {'fill': '#f8cecc', 'stroke': '#b85450', 'font': '#000000'},
            'Calon Siswa': {'fill': '#dae8fc', 'stroke': '#6c8ebf', 'font': '#000000'},
            'Kepala Sekolah': {'fill': '#d5e8d4', 'stroke': '#82b366', 'font': '#000000'},
            'Siswa': {'fill': '#ffe6cc', 'stroke': '#d79b00', 'font': '#000000'},
            'Bendahara': {'fill': '#e1d5e7', 'stroke': '#9673a6', 'font': '#000000'}
        }

        self.current_y = 50
        self.node_id_counter = 2

    def generate(self, tree_data):
        self.mxfile = ET.Element("mxfile", host="Electron", modified="2024-05-16T00:00:00.000Z", agent="Mozilla/5.0", version="24.4.0", type="device")
        self.diagram = ET.SubElement(self.mxfile, "diagram", name="Sitemap", id="sitemap_id")
        self.mxGraphModel = ET.SubElement(self.diagram, "mxGraphModel", dx="1000", dy="1000", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="1169", pageHeight="827", math="0", shadow="0")
        self.root = ET.SubElement(self.mxGraphModel, "root")

        ET.SubElement(self.root, "mxCell", id="0")
        ET.SubElement(self.root, "mxCell", id="1", parent="0")

        self.current_y = 50
        self.layout(tree_data, 0)
        self.draw_node(tree_data, None)

        tree = ET.ElementTree(self.mxfile)
        ET.indent(tree, space="  ", level=0)
        os.makedirs(os.path.dirname(self.file_name), exist_ok=True)
        tree.write(self.file_name, encoding="utf-8", xml_declaration=True)
        print(f"Generated {self.file_name}")

    def layout(self, node, depth):
        if not node.get('children'):
            node['x'] = 50 + depth * (NODE_WIDTH + X_SPACING)
            node['y'] = self.current_y
            self.current_y += NODE_HEIGHT + Y_SPACING
            return node['y']
        else:
            children_y = []
            for child in node['children']:
                children_y.append(self.layout(child, depth + 1))

            node['x'] = 50 + depth * (NODE_WIDTH + X_SPACING)
            node['y'] = sum(children_y) / len(children_y)
            return node['y']

    def draw_node(self, node, parent_node_id):
        node_id = str(self.node_id_counter)
        self.node_id_counter += 1

        display_name = f"<b>{node['name']}</b>"
        if 'route' in node and node['route']:
            display_name += f"<br/>{node['route']}"

        value = escape_xml(display_name)
        c = self.colors.get(self.color, {'fill': '#ffffff', 'stroke': '#000000', 'font': '#000000'})
        style = f"rounded=1;whiteSpace=wrap;html=1;fillColor={c['fill']};strokeColor={c['stroke']};fontColor={c['font']};"

        cell = ET.SubElement(self.root, "mxCell", id=node_id, value=value, style=style, vertex="1", parent="1")
        ET.SubElement(cell, "mxGeometry", x=str(node['x']), y=str(node['y']), width=str(NODE_WIDTH), height=str(NODE_HEIGHT), **{"as": "geometry"})

        if parent_node_id is not None:
            edge_id = str(self.node_id_counter)
            self.node_id_counter += 1
            edge_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
            edge = ET.SubElement(self.root, "mxCell", id=edge_id, style=edge_style, edge="1", parent="1", source=parent_node_id, target=node_id)
            ET.SubElement(edge, "mxGeometry", relative="1", **{"as": "geometry"})

        for child in node.get('children', []):
            self.draw_node(child, node_id)

if __name__ == "__main__":
    admin_tree = {
        'name': 'Login Sistem', 'route': '/auth/login',
        'children': [
            {
                'name': 'Dashboard Admin', 'route': '/admin',
                'children': [
                    {
                        'name': 'Data Pengguna', 'route': '',
                        'children': [
                            {'name': 'Kelola Pengguna', 'route': '/admin/users'},
                            {'name': 'Kelola Role', 'route': '/admin/roles'},
                            {'name': 'Kelola Izin', 'route': '/admin/permissions'},
                        ]
                    },
                    {
                        'name': 'Data Akademik', 'route': '',
                        'children': [
                            {'name': 'Tahun Ajaran', 'route': '/admin/academic-years'},
                            {'name': 'Kelas', 'route': '/admin/classes'},
                        ]
                    },
                    {
                        'name': 'PPDB & Siswa', 'route': '',
                        'children': [
                            {'name': 'Calon Siswa Baru', 'route': '/admin/new-students'},
                            {'name': 'Pendaftaran PPDB', 'route': '/admin/registrations'},
                            {
                                'name': 'Data Master Siswa', 'route': '/admin/students',
                                'children': [
                                    {'name': 'Tambah Siswa', 'route': '/admin/students/create'},
                                    {'name': 'Import Siswa', 'route': '/admin/students/import'},
                                    {'name': 'Edit Siswa', 'route': '/admin/students/[id]/edit'},
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'Sistem', 'route': '',
                        'children': [
                            {'name': 'Log Aktivitas', 'route': '/admin/activity-log'},
                            {'name': 'Pengaturan', 'route': '/admin/settings'},
                        ]
                    }
                ]
            }
        ]
    }

    calon_siswa_tree = {
        'name': 'Halaman Utama / Landing', 'route': '/',
        'children': [
            {
                'name': 'Pendaftaran Calon Siswa', 'route': '/calon-siswa/register',
                'children': [
                    {
                        'name': 'Login Calon Siswa', 'route': '/calon-siswa/login',
                        'children': [
                            {
                                'name': 'Dashboard Calon Siswa', 'route': '/calon-siswa/dashboard',
                                'children': [
                                    {'name': 'Cek Status Pendaftaran', 'route': '/registration/status'},
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }

    headmaster_tree = {
        'name': 'Login Sistem', 'route': '/auth/login',
        'children': [
            {
                'name': 'Dashboard Kepala Sekolah', 'route': '/headmaster',
                'children': [
                    {'name': 'Laporan Terpusat', 'route': '/headmaster/reports'},
                    {'name': 'Data Siswa & Akademik', 'route': '/headmaster/students'},
                ]
            }
        ]
    }

    student_tree = {
        'name': 'Login Sistem', 'route': '/auth/login',
        'children': [
            {
                'name': 'Dashboard Siswa', 'route': '/student/dashboard',
                'children': [
                    {'name': 'Profil Siswa', 'route': '/student/profile'},
                    {'name': 'Informasi SPP', 'route': '/student/spp'},
                    {
                        'name': 'Daftar Ulang', 'route': '/student/re-registration',
                        'children': [
                            {'name': 'Pembayaran Daftar Ulang', 'route': '/student/re-registration/pay'},
                        ]
                    },
                    {
                        'name': 'Riwayat Transaksi', 'route': '/student/history',
                        'children': [
                            {'name': 'Detail Transaksi', 'route': '/student/history/[id]'},
                        ]
                    }
                ]
            }
        ]
    }

    treasurer_tree = {
        'name': 'Login Sistem', 'route': '/auth/login',
        'children': [
            {
                'name': 'Dashboard Bendahara', 'route': '/treasurer/dashboard',
                'children': [
                    {
                        'name': 'Tagihan & Pembayaran', 'route': '',
                        'children': [
                            {
                                'name': 'Kelola Tagihan', 'route': '/treasurer/billing',
                                'children': [
                                    {'name': 'Daftar Tagihan', 'route': '/treasurer/billing/list'},
                                    {'name': 'Detail Tagihan', 'route': '/treasurer/billing/[id]'},
                                ]
                            },
                            {
                                'name': 'Penerimaan Pembayaran', 'route': '/treasurer/payment',
                                'children': [
                                    {'name': 'Input Pembayaran Manual', 'route': '/treasurer/payment/manual'},
                                ]
                            },
                            {'name': 'Riwayat Pembayaran', 'route': '/treasurer/history'},
                        ]
                    },
                    {
                        'name': 'Modul Khusus', 'route': '',
                        'children': [
                            {'name': 'Manajemen SPP', 'route': '/treasurer/spp'},
                            {'name': 'Manajemen Daftar Ulang', 'route': '/treasurer/re-registration'},
                        ]
                    },
                    {
                        'name': 'Keuangan Inti', 'route': '',
                        'children': [
                            {'name': 'Buku Besar (Ledger)', 'route': '/treasurer/buku-besar'},
                            {'name': 'Catat Pengeluaran', 'route': '/treasurer/expenses'},
                            {'name': 'Laporan Keuangan', 'route': '/treasurer/reports'},
                        ]
                    },
                    {
                        'name': 'Lainnya', 'route': '',
                        'children': [
                            {'name': 'Data Siswa', 'route': '/treasurer/students'},
                            {'name': 'Reminder WhatsApp', 'route': '/treasurer/wa-reminder'},
                            {'name': 'Backup Data', 'route': '/treasurer/backup'},
                        ]
                    }
                ]
            }
        ]
    }

    SitemapGenerator('Admin', 'docs/sitemap_admin.drawio').generate(admin_tree)
    SitemapGenerator('Calon Siswa', 'docs/sitemap_calon_siswa.drawio').generate(calon_siswa_tree)
    SitemapGenerator('Kepala Sekolah', 'docs/sitemap_headmaster.drawio').generate(headmaster_tree)
    SitemapGenerator('Siswa', 'docs/sitemap_student.drawio').generate(student_tree)
    SitemapGenerator('Bendahara', 'docs/sitemap_treasurer.drawio').generate(treasurer_tree)
