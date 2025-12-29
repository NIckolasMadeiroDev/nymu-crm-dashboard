import React, { useCallback, useEffect, useState } from "react";
import ContactsTable from "./ContactsTable";
import ContactsSearchBar from "./ContactsSearchBar";
import ContactDetailsDrawer from "./ContactDetailsDrawer";
import ContactEditDrawer from "./ContactEditDrawer";
import Pagination from "./Pagination";
import { HelenaContact } from "@/services/helena/helena-contacts-service";
import { helenaServiceFactory } from '@/services/helena/helena-service-factory'
const contactsService = helenaServiceFactory.getContactsService();

type ViewMode = 'grid' | 'list'
type StatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED' | 'BLOCKED'

export default function ContactsManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<HelenaContact[]>([]);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<HelenaContact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(15);

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
  }, [pageSize]);

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

  // Filtra contatos por status localmente
  const filteredContacts = statusFilter === 'ALL' 
    ? contacts 
    : contacts.filter(c => c.status === statusFilter);

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 space-y-4 bg-white dark:bg-gray-900">
      {/* Header + Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-primary">
            Gestão de Contatos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-secondary">
            Gerencie seus contatos de forma eficiente e organizada
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors flex items-center gap-2 font-secondary"
            onClick={handleCreateContact}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Contato
          </button>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="space-y-3">
        <ContactsSearchBar
          value={search}
          onChange={setSearch}
          onSearch={handleSearch}
        />
        
        {/* Filtros e Visualização */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary">Filtrar:</span>
            <div className="flex gap-1">
              {(['ALL', 'ACTIVE', 'ARCHIVED', 'BLOCKED'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors font-secondary ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {(() => {
                    if (status === 'ALL') return 'Todos'
                    if (status === 'ACTIVE') return 'Ativos'
                    if (status === 'ARCHIVED') return 'Arquivados'
                    return 'Bloqueados'
                  })()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-secondary">Visualização:</span>
            <div className="flex gap-1 bg-white dark:bg-gray-700 rounded-lg p-0.5 border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                aria-label="Visualização em lista"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                aria-label="Visualização em grade"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
            
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-secondary"
            >
              <option value={10}>10 por página</option>
              <option value={15}>15 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Contatos */}
      <div className="flex-1 overflow-auto">
        <ContactsTable 
          contacts={filteredContacts} 
          isLoading={isLoading} 
          onRowClick={handleRowClick}
          viewMode={viewMode}
        />
      </div>

      {/* Paginação */}
      {!isLoading && filteredContacts.length > 0 && (
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
