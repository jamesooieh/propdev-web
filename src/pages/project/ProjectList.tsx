import React, { useMemo, useState, useEffect } from 'react';
import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { ProjectService, ProjectParams, Project } from '../../services/project';
import { ProjectStatus, ProjectStatusLabels } from '../../enums';
import { usePermission } from '../../hooks/usePermission';

// UI Components
import PageHeader from '../../components/common/PageHeader';
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_SortingState,
    type MRT_PaginationState,
} from 'material-react-table';
import {
    Container, Box, Typography, Button, Alert, IconButton, Chip, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Visibility, Warning } from '@mui/icons-material';

const ProjectList: React.FC = () => {
    const history = useHistory();
    const { can } = usePermission();

    // --- State ---
    const [data, setData] = useState<Project[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // MRT State
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<MRT_SortingState>([{ id: 'created_at', desc: true }]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null); // Store full object for better UI
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Fetch Data ---
    const fetchProjects = async () => {
        if (!can('view-projects')) return;

        setLoading(true);
        setError(null);
        try {
            const queryParams: ProjectParams = {
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: globalFilter || undefined,
                sort: sorting.length > 0 ? sorting[0].id : 'created_at',
                direction: (sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc') as 'asc' | 'desc',
            };
            const res = await ProjectService.getAll(queryParams);
            setData(res.data);
            setTotalRows(res.meta?.total || res.total || 0);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load projects.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);
    useIonViewWillEnter(() => { fetchProjects(); });

    // --- Delete Logic ---

    const handleDeleteClick = (project: Project) => {
        setProjectToDelete(project);
        setDeleteDialogOpen(true);
        setError(null); // Clear previous errors
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        setError(null);

        try {
            await ProjectService.delete(projectToDelete.id);
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
            fetchProjects();
        } catch (err: any) {
            console.error(err);
            setDeleteDialogOpen(false); // Close dialog to show error on main screen

            // Handle specific 422 Integrity Error (e.g., has active categories)
            if (err.response && err.response.status === 422) {
                setError(err.response.data.message || "Cannot delete this project because it is in use.");
            } else {
                setError("An unexpected error occurred while deleting the project.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<Project>[]>(
        () => [
            {
                accessorKey: 'title',
                header: 'Project Title',
                size: 250,
                Cell: ({ row }) => (
                    <Typography variant="body2" fontWeight="bold">
                        {row.original.title}
                    </Typography>
                ),
            },
            {
                accessorKey: 'asp_no',
                header: 'ASP No.',
                size: 150,
                Cell: ({ cell }) => (
                    <Typography variant="body2">{cell.getValue<string>() || '-'}</Typography>
                )
            },
            {
                accessorKey: 'do_no',
                header: 'DO No.',
                size: 150,
                Cell: ({ cell }) => (
                    <Typography variant="body2">{cell.getValue<string>() || '-'}</Typography>
                )
            },
            {
                accessorKey: 'status',
                header: 'Status',
                size: 120,
                Cell: ({ cell }) => {
                    const status = cell.getValue<ProjectStatus>();
                    const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
                        'active': 'success',
                        'completed': 'info',
                        'pending': 'warning',
                        'archived': 'default'
                    };
                    return (
                        <Chip
                            label={ProjectStatusLabels[status] || status}
                            size="small"
                            color={statusColors[status] || 'default'}
                            variant="outlined"
                        />
                    );
                },
            },
        ],
        [],
    );

    const table = useMaterialReactTable({
        columns,
        data,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        rowCount: totalRows,
        state: { isLoading: loading, showProgressBars: loading, pagination, sorting, globalFilter },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        enableRowActions: true,
        positionActionsColumn: 'last',
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                {can('view-projects') && (
                    <Tooltip title="View Dashboard">
                        <IconButton color="info" onClick={() => history.push(`/projects/dashboard/${row.original.id}`)}>
                            <Visibility />
                        </IconButton>
                    </Tooltip>
                )}
                {can('update-projects') && (
                    <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => history.push(`/projects/edit/${row.original.id}`)}>
                            <Edit />
                        </IconButton>
                    </Tooltip>
                )}
                {can('delete-projects') && (
                    <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                            <Delete />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        ),
        renderTopToolbarCustomActions: () => (
            <Button startIcon={<Refresh />} onClick={fetchProjects} size="small">Refresh</Button>
        ),
        muiTablePaperProps: { elevation: 2, sx: { borderRadius: '8px' } },
        enableColumnFilters: false,
    });

    return (
        <IonPage>
            <IonContent fullscreen>
                <PageHeader title="Projects" />
                <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
                    <Container maxWidth="xl">

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                            {can('create-projects') && (
                                <Button variant="contained" startIcon={<Add />} onClick={() => history.push('/projects/create')}>
                                    Add Project
                                </Button>
                            )}
                        </Box>

                        {!can('view-projects') ? (
                            <Alert severity="error">You do not have permission to view this data.</Alert>
                        ) : (
                            <>
                                {/* Display Errors Here */}
                                {error && (
                                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                                        {error}
                                    </Alert>
                                )}
                                <MaterialReactTable table={table} />
                            </>
                        )}

                        {/* --- Delete Confirmation Dialog --- */}
                        <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)}>
                            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Warning color="error" /> Confirm Deletion
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    Are you sure you want to delete the project <strong>{projectToDelete?.title}</strong>?
                                    <br /><br />
                                    This action will remove the project and its settings.
                                    <br />
                                    <Typography variant="caption" color="text.secondary">
                                        (Note: Deletion will be blocked if this project still contains active categories or lands.)
                                    </Typography>
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={confirmDelete} 
                                    color="error" 
                                    variant="contained" 
                                    disabled={isDeleting}
                                    startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <Delete />}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </DialogActions>
                        </Dialog>

                    </Container>
                </Box>
            </IonContent>
        </IonPage>
    );
};

export default ProjectList;