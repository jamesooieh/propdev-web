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
    group: Group & { category?: Category }; 
    onBack?: () => void;
}

const TypeListWorkspace: React.FC<TypeListWorkspaceProps> = ({ projectId, group, onBack }) => {
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
        setCurrentType({ 
            status: 'A', 
            unit_count: 0, 
            lot_width: 0, 
            lot_length: 0, 
            lot_size_sqft: 0, 
            built_up_sqft: 0, 
            price_psf: 0,
            discounts: [], // Initialize empty discounts
        });
        setIsEditMode(false);
        setDialogOpen(true);
    };

    const handleOpenEdit = (type: Type) => {
        setCurrentType({ ...type }); 
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
                // Destructure to separate group_id from the rest of the data
                const { group_id, ...updatePayload } = currentType;
                
                await TypeService.update(projectId, categoryId, group.id, currentType.id, updatePayload);
            } else {
                await TypeService.create({
                    ...currentType,
                    project_id: projectId,
                    category_id: categoryId,
                    group_id: group.id,
                    title: currentType.title!, 
                    status: 'A' 
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
        setCurrentType((prev) => {
            const updated = { ...prev, [field]: value };

            // Auto-calculate Lot Size if Width or Length changes
            if (field === 'lot_width' || field === 'lot_length') {
                const w = field === 'lot_width' ? Number(value) : Number(prev.lot_width || 0);
                const l = field === 'lot_length' ? Number(value) : Number(prev.lot_length || 0);
                updated.lot_size_sqft = w * l;
            }

            return updated;
        });
    };

    // --- Discount Handlers (NEW) ---
    const handleAddDiscount = () => {
        setCurrentType(prev => ({
            ...prev,
            discounts: [...(prev.discounts || []), { title: '', rate_percent: 0, amount: 0 }]
        }));
    };

    const handleRemoveDiscount = (index: number) => {
        setCurrentType(prev => ({
            ...prev,
            discounts: (prev.discounts || []).filter((_, i) => i !== index)
        }));
    };

    const handleDiscountChange = (index: number, field: string, value: any) => {
        setCurrentType(prev => {
            const newDiscounts = [...(prev.discounts || [])];
            newDiscounts[index] = { ...newDiscounts[index], [field]: value };
            return { ...prev, discounts: newDiscounts };
        });
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<Type>[]>(
        () => [
            {
                accessorKey: 'title',
                header: 'Type Title',
                size: 150,
                Cell: ({ cell }) => <strong>{cell.getValue<string>()}</strong>,
            },

            {
                accessorKey: 'unit_count',
                header: 'Units',
                size: 90,
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
            },
            // Combine dimensions into one column for display
            {
                id: 'dimensions',
                header: 'Dim (WxL)',
                size: 100,
                accessorFn: (row) => row.lot_width && row.lot_length ? `${row.lot_width}' x ${row.lot_length}'` : '-',
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
            },
            {
                accessorKey: 'lot_size_sqft',
                header: 'Lot Size',
                size: 110,
                Cell: ({ cell }) => numberFormatter.format(cell.getValue<number>()),
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
            },
            {
                accessorKey: 'built_up_sqft',
                header: 'Built-up',
                size: 110,
                Cell: ({ cell }) => numberFormatter.format(cell.getValue<number>()),
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
            },
            {
                accessorKey: 'gross_gdv',
                header: 'Gross GDV',
                size: 140,
                Cell: ({ cell }) => currencyFormatter.format(cell.getValue<number>()),
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
            },
            {
                accessorKey: 'net_gdv',
                header: 'Net GDV',
                size: 140,
                Cell: ({ cell }) => (
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {currencyFormatter.format(cell.getValue<number>())}
                    </Typography>
                ),
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
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
                            {/* Row 1: Identifiers */}
                            <Grid size={{ xs: 12, md: 8 }}>
                                <TextField 
                                    label="Type Title" fullWidth required 
                                    value={currentType.title || ''} 
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    label="Unit Count" type="number" fullWidth 
                                    value={currentType.unit_count || ''} 
                                    onChange={(e) => handleInputChange('unit_count', Number(e.target.value))}
                                />
                            </Grid>


                            {/* Row 2: Physical Specs - Width & Length */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    label="Lot Width (ft)" type="number" fullWidth 
                                    value={currentType.lot_width || ''} 
                                    onChange={(e) => handleInputChange('lot_width', Number(e.target.value))}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    label="Lot Length (ft)" type="number" fullWidth 
                                    value={currentType.lot_length || ''} 
                                    onChange={(e) => handleInputChange('lot_length', Number(e.target.value))}
                                />
                            </Grid>
                            
                            {/* Lot Size Override */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    label="Lot Size Override (sqft)" type="number" fullWidth 
                                    placeholder="Auto-calc if empty"
                                    value={currentType.lot_size_sqft || ''} 
                                    onChange={(e) => handleInputChange('lot_size_sqft', Number(e.target.value))}
                                    helperText="Leave empty to calc from W x L"
                                />
                            </Grid>

                            {/* Row 3: Financials */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    label="Built-up Area (sqft)" type="number" fullWidth 
                                    value={currentType.built_up_sqft || ''} 
                                    onChange={(e) => handleInputChange('built_up_sqft', Number(e.target.value))}
                                    slotProps={{ input: { endAdornment: <InputAdornment position="end">sqft</InputAdornment> } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField 
                                    label="Price PSF (Gross)" type="number" fullWidth 
                                    value={currentType.price_psf || ''} 
                                    onChange={(e) => handleInputChange('price_psf', Number(e.target.value))}
                                    slotProps={{ input: { startAdornment: <InputAdornment position="start">RM</InputAdornment> } }}
                                />
                            </Grid>

                            {/* --- DISCOUNTS SECTION (NEW) --- */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', pb: 1 }}>
                                    <Typography variant="subtitle2" color="primary">Discounts / Rebates</Typography>
                                    <Button size="small" startIcon={<Add />} onClick={handleAddDiscount}>
                                        Add Item
                                    </Button>
                                </Box>
                                
                                {currentType.discounts?.map((discount, index) => (
                                    <Grid container spacing={1} key={index} sx={{ mb: 1 }} alignItems="flex-start">
                                        <Grid size={{ xs: 5 }}>
                                            <TextField 
                                                label="Title" size="small" fullWidth required
                                                value={discount.title} 
                                                placeholder="e.g. Early Bird"
                                                onChange={(e) => handleDiscountChange(index, 'title', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 3 }}>
                                            <TextField 
                                                label="Rate (%)" size="small" type="number" fullWidth 
                                                value={discount.rate_percent || ''} 
                                                onChange={(e) => handleDiscountChange(index, 'rate_percent', Number(e.target.value))}
                                                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 3 }}>
                                            <TextField 
                                                label="Fixed Amt" size="small" type="number" fullWidth 
                                                value={discount.amount || ''} 
                                                onChange={(e) => handleDiscountChange(index, 'amount', Number(e.target.value))}
                                                helperText={discount.amount && discount.amount > 0 ? "Overrides Rate" : ""}
                                                slotProps={{ 
                                                    input: { startAdornment: <InputAdornment position="start">RM</InputAdornment> },
                                                    formHelperText: { sx: { fontSize: '0.65rem', m: 0, color: 'orange' } } 
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 1 }} sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
                                            <IconButton size="small" color="error" onClick={() => handleRemoveDiscount(index)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}
                                
                                {(!currentType.discounts || currentType.discounts.length === 0) && (
                                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', display: 'block', mb: 2 }}>
                                        No discounts added. Net Price will equal Gross Price.
                                    </Typography>
                                )}
                            </Grid>
                            
                            <Grid size={{ xs: 12 }}>
                                <Alert severity="info" icon={false} sx={{ mt: 1 }}>
                                    <Typography variant="caption">
                                        Calculated fields (GDV, Net Price) will update automatically upon saving.
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