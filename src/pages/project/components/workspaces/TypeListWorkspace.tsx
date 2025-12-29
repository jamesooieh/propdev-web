import React, { useMemo, useState, useEffect } from 'react';
import { 
    MaterialReactTable, 
    useMaterialReactTable, 
    type MRT_ColumnDef, 
    type MRT_SortingState, 
    type MRT_PaginationState 
} from 'material-react-table';
import { 
    Box, IconButton, Tooltip, Chip, Button, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField, 
    Typography, Alert, Grid, MenuItem, InputAdornment 
} from '@mui/material';
import { Edit, Delete, Refresh, Add, ArrowBack, Warning } from '@mui/icons-material';

// Services
import { TypeService, Type } from '../../../../services/type';
import { Group } from '../../../../services/group';
import { Category } from '../../../../services/category';

// Formatters
const currencyFormatter = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' });
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

interface TypeListWorkspaceProps {
    projectId: string;
    group: Group & { category?: Category }; // Expect group to have category loaded or passed in context
    onBack?: () => void;
}

const TypeListWorkspace: React.FC<TypeListWorkspaceProps> = ({ projectId, group, onBack }) => {
    // We safely assume category ID exists. In a real app, ensure it's passed down correctly.
    // If group.category is missing, we might need to fetch the group details again or pass it from parent.
    const categoryId = group.category_id || group.category?.id || '';

    // --- State ---
    const [data, setData] = useState<Type[]>([]);
    const [totalRows, setTotalRows] = useState(0); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // MRT State
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<MRT_SortingState>([{ id: 'title', desc: false }]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });

    // Dialogs
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentType, setCurrentType] = useState<Partial<Type>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Fetch Data ---
    const fetchTypes = async () => {
        if (!projectId || !categoryId || !group.id) return;

        setLoading(true);
        setError(null);
        try {
            const res = await TypeService.getAll({
                project_id: projectId,
                category_id: categoryId,
                group_id: group.id,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: globalFilter || undefined,
                sort: sorting.length > 0 ? sorting[0].id : 'created_at',
                direction: (sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc') as 'asc' | 'desc',
            });
            setData(res.data || []);
            setTotalRows(res.meta?.total || res.total || 0);
        } catch (e) {
            console.error(e);
            setError("Failed to load types.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTypes(); }, [projectId, categoryId, group.id, pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);

    // --- Form Handlers ---
    const handleOpenCreate = () => {
        setCurrentType({ status: 'A', unit_count: 0, lot_size_sqft: 0, built_up_sqft: 0, price_psf: 0 });
        setIsEditMode(false);
        setDialogOpen(true);
    };

    const handleOpenEdit = (type: Type) => {
        setCurrentType({ ...type }); // Clone data
        setIsEditMode(true);
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!currentType.title) {
            alert("Title is required");
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditMode && currentType.id) {
                await TypeService.update(projectId, categoryId, group.id, currentType.id, currentType);
            } else {
                await TypeService.create({
                    ...currentType,
                    project_id: projectId,
                    category_id: categoryId,
                    group_id: group.id,
                    title: currentType.title!, // TS check handled above
                    status: currentType.status || 'A'
                });
            }
            setDialogOpen(false);
            fetchTypes();
        } catch (e) {
            console.error(e);
            alert("Operation failed. Check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!currentType.id) return;
        setIsSubmitting(true);
        try {
            await TypeService.delete(projectId, categoryId, group.id, currentType.id);
            setDeleteDialogOpen(false);
            fetchTypes();
        } catch (e) {
            alert("Failed to delete.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Helper for TextFields in Dialog ---
    const handleInputChange = (field: keyof Type, value: any) => {
        setCurrentType(prev => ({ ...prev, [field]: value }));
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<Type>[]>(
        () => [
            // Identifiers
            {
                accessorKey: 'title',
                header: 'Type Title',
                size: 150,
                Cell: ({ cell }) => <strong>{cell.getValue<string>()}</strong>,
            },
            {
                accessorKey: 'status',
                header: 'Sts',
                size: 80,
                Cell: ({ cell }) => (
                    <Chip 
                        label={cell.getValue<string>() === 'A' ? 'Act' : 'Inact'} 
                        color={cell.getValue<string>() === 'A' ? 'success' : 'default'} 
                        size="small" 
                        variant="outlined"
                    />
                )
            },
            // Inputs
            {
                accessorKey: 'unit_count',
                header: 'Units',
                size: 100,
                muiTableBodyCellProps: { align: 'right' },
            },
            {
                accessorKey: 'lot_size_sqft',
                header: 'Lot Size (sf)',
                size: 120,
                Cell: ({ cell }) => numberFormatter.format(cell.getValue<number>()),
                muiTableBodyCellProps: { align: 'right' },
            },
            {
                accessorKey: 'built_up_sqft',
                header: 'Built-up (sf)',
                size: 120,
                Cell: ({ cell }) => numberFormatter.format(cell.getValue<number>()),
                muiTableBodyCellProps: { align: 'right' },
            },
            // Financials (Computed)
            {
                accessorKey: 'gross_gdv',
                header: 'Gross GDV',
                size: 150,
                Cell: ({ cell }) => currencyFormatter.format(cell.getValue<number>()),
                muiTableBodyCellProps: { align: 'right' },
            },
            {
                accessorKey: 'net_gdv',
                header: 'Net GDV',
                size: 150,
                Cell: ({ cell }) => (
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {currencyFormatter.format(cell.getValue<number>())}
                    </Typography>
                ),
                muiTableBodyCellProps: { align: 'right' },
            },
            // Ratios
            {
                accessorKey: 'units_per_acre',
                header: 'Units/Ac',
                size: 100,
                Cell: ({ cell }) => numberFormatter.format(cell.getValue<number>()),
                muiTableBodyCellProps: { align: 'right' },
            },
        ],
        []
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
        enableColumnFilters: false,
        initialState: { density: 'compact' },
        
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                <Tooltip title="Edit">
                    <IconButton color="primary" onClick={() => handleOpenEdit(row.original)}>
                        <Edit />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => { setCurrentType(row.original); setDeleteDialogOpen(true); }}>
                        <Delete />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
        
        renderTopToolbarCustomActions: () => (
            <Button startIcon={<Refresh />} onClick={fetchTypes} size="small">
                Refresh
            </Button>
        ),
    });

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {onBack && (
                        <Button startIcon={<ArrowBack />} onClick={onBack} variant="outlined" size="small">
                            Back
                        </Button>
                    )}
                    <Box>
                        <Typography variant="h5">Manage Types</Typography>
                        <Typography variant="caption" color="textSecondary">
                            Group: <strong>{group.title}</strong>
                        </Typography>
                    </Box>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
                    Add Type
                </Button>
            </Box>
            
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
            
            <MaterialReactTable table={table} />

            {/* --- CREATE / EDIT DIALOG --- */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Type' : 'Add New Type'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            {/* Row 1: Basics */}
                            <Grid size={{ xs: 12, md: 8 }}>
                                <TextField 
                                    label="Type Title" fullWidth required 
                                    value={currentType.title || ''} 
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    select label="Status" fullWidth 
                                    value={currentType.status || 'A'} 
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                >
                                    <MenuItem value="A">Active</MenuItem>
                                    <MenuItem value="I">Inactive</MenuItem>
                                </TextField>
                            </Grid>

                            {/* Row 2: Physical Specs */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    label="Unit Count" type="number" fullWidth 
                                    value={currentType.unit_count || ''} 
                                    onChange={(e) => handleInputChange('unit_count', Number(e.target.value))}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    label="Lot Size (sqft)" type="number" fullWidth 
                                    value={currentType.lot_size_sqft || ''} 
                                    onChange={(e) => handleInputChange('lot_size_sqft', Number(e.target.value))}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    label="Dimension (e.g. 22x75)" fullWidth 
                                    value={currentType.lot_dimension_text || ''} 
                                    onChange={(e) => handleInputChange('lot_dimension_text', e.target.value)}
                                />
                            </Grid>

                            {/* Row 3: Financials */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField 
                                    label="Built-up Area (sqft)" type="number" fullWidth 
                                    value={currentType.built_up_sqft || ''} 
                                    onChange={(e) => handleInputChange('built_up_sqft', Number(e.target.value))}
                                    slotProps={{ input: { endAdornment: <InputAdornment position="end">sqft</InputAdornment> } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField 
                                    label="Price PSF (Gross)" type="number" fullWidth 
                                    value={currentType.price_psf || ''} 
                                    onChange={(e) => handleInputChange('price_psf', Number(e.target.value))}
                                    slotProps={{ input: { startAdornment: <InputAdornment position="start">RM</InputAdornment> } }}
                                />
                            </Grid>
                            
                            <Grid size={{ xs: 12 }}>
                                <Alert severity="info" icon={false} sx={{ mt: 1 }}>
                                    <Typography variant="caption">
                                        Note: GDV, Total Land Size, and Net calculations will be automatically updated by the system based on these inputs.
                                        Discounts can be managed in the Discount Detail view (Coming Soon).
                                    </Typography>
                                </Alert>
                            </Grid>

                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- DELETE DIALOG --- */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" /> Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete <strong>{currentType.title}</strong>?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TypeListWorkspace;