import React, { useCallback, useEffect, useState } from "react";
import ContactsTable from "./ContactsTable";
import ContactsSearchBar from "./ContactsSearchBar";
import ContactDetailsDrawer from "./ContactDetailsDrawer";
import ContactEditDrawer from "./ContactEditDrawer";
import Pagination from "./Pagination";
import { HelenaContact } from "@/services/helena/helena-contacts-service";
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'
const contactsService = helenaServiceFactory.getContactsService();

export default function ContactsManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<HelenaContact[]>([]);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<HelenaContact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 15;

  // --- Novos estados para criação/edição/deleção ---
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create'|'edit'>("create");
  const [editContact, setEditContact] = useState<Partial<HelenaContact> | undefined>();
  const [editLoading, setEditLoading] = useState(false);

  // Busca contatos ao entrar ou buscar
  const fetchContacts = useCallback(async (searchTerm?: string, page: number = 1) => {
    setIsLoading(true);
    try {
      let data;
      if (searchTerm && searchTerm.trim() !== "") {
        data = await contactsService.filterContacts({ 
          textFilter: searchTerm, 
          pageSize,
          pageNumber: page 
        });
      } else {
        data = await contactsService.listContacts({ 
          PageSize: pageSize,
          PageNumber: page 
        });
      }
      setContacts(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
      setContacts([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts(); // inicializa lista
  }, [fetchContacts]);

  // Busca/filtra
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchContacts(search, 1);
  }, [fetchContacts, search]);

  // Navegação de páginas
  const handlePageChange = useCallback((page: number) => {
    fetchContacts(search, page);
  }, [fetchContacts, search]);

  // Clique linha => drawer detalhes
  const handleRowClick = useCallback((c: HelenaContact) => {
    setSelectedContact(c);
    setDrawerOpen(true);
  }, []);

  // --- Abrir cadastro/criação ---
  const handleCreateContact = useCallback(() => {
    setEditMode('create');
    setEditContact(undefined);
    setEditOpen(true);
  }, []);

  // --- Submeter criação/edição (modo simples: nome, telefone, email) ---
  const handleSaveContact = async (form: Partial<HelenaContact>) => {
    setEditLoading(true)
    try {
      if (editMode === 'create') {
        await contactsService.createContact(form);
      } else if (editContact?.id) {
        await contactsService.updateContactById(editContact.id, form);
      }
      setEditOpen(false);
      fetchContacts();
    } finally {
      setEditLoading(false)
    }
  }

  // Editar do Drawer de detalhes
  const handleEditContact = useCallback(() => {
    if (!selectedContact) return;
    setEditContact(selectedContact);
    setEditMode('edit');
    setDrawerOpen(false);
    setEditOpen(true);
  }, [selectedContact]);

  // Deletar do Drawer de detalhes
  const handleDeleteContact = useCallback(async () => {
    if (!selectedContact) return;
    setEditLoading(true)
    try {
      await contactsService.deleteContactById(selectedContact.id);
      setDrawerOpen(false);
      fetchContacts();
    } finally {
      setEditLoading(false)
    }
  }, [selectedContact, fetchContacts]);

  // Drawer detalhes fecha
  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setSelectedContact(null);
  }, []);

  // Drawer edição fecha
  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setEditContact(undefined);
  }, []);

  return (
    <div className="flex flex-col min-h-[60vh] max-w-5xl mx-auto p-4 space-y-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header + Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-2">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Gestão de Contatos</h1>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={handleCreateContact}
          >Novo Contato</button>
        </div>
      </div>
      {/* Busca/Filtros componetizados */}
      <ContactsSearchBar
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
      />
      {/* Tabela de Contatos */}
      <div className="flex-1 min-h-[240px]">
        <ContactsTable contacts={contacts} isLoading={isLoading} onRowClick={handleRowClick} />
      </div>

      {/* Paginação */}
      {!isLoading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onPageChange={handlePageChange}
        />
      )}
      {/* Drawer de detalhes */}
      <ContactDetailsDrawer
        open={drawerOpen}
        contact={selectedContact}
        onClose={handleDrawerClose}
        onEdit={handleEditContact}
        onDelete={handleDeleteContact}
      />
      {/* Drawer de edição/criação */}
      <ContactEditDrawer
        open={editOpen}
        loading={editLoading}
        mode={editMode}
        contact={editContact}
        onSubmit={handleSaveContact}
        onClose={handleEditClose}
      />
    </div>
  );
}
