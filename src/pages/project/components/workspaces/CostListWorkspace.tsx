import React, { useMemo, useState, useEffect } from 'react';
import { 
    MaterialReactTable, 
    useMaterialReactTable, 
    type MRT_ColumnDef, 
    type MRT_Row,
} from 'material-react-table';
import { 
    Box, IconButton, Tooltip, Button, Dialog, DialogTitle, 
    DialogContent, DialogContentText, DialogActions, TextField, 
    Typography, Alert, Grid, Divider 
} from '@mui/material';
import { 
    Edit, Delete, Refresh, Add, Warning, Receipt, 
    DragIndicator, RemoveCircleOutline 
} from '@mui/icons-material';

// Services
import { CostService, Cost, CostValue } from '../../../../services/cost';
import { CostCategory } from '../../../../services/costCategory';
import { CostGroup } from '../../../../services/costGroup';

interface CostListWorkspaceProps {
    projectId: string;
    // We need the full hierarchy context for the URL
    costCategory: CostCategory; 
    costGroup: CostGroup;
}

const CostListWorkspace: React.FC<CostListWorkspaceProps> = ({ 
    projectId, 
    costCategory,
    costGroup
}) => {
    // --- Data State ---
    const [data, setData] = useState<Cost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Table State (No Pagination/Sorting for DnD) ---
    const [globalFilter, setGlobalFilter] = useState('');
    
    // --- Dialog States ---
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCost, setCurrentCost] = useState<Partial<Cost>>({});
    const [currentValues, setCurrentValues] = useState<Partial<CostValue>[]>([]); // Local state for nested form values

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [costToDelete, setCostToDelete] = useState<Cost | null>(null);

    // --- Fetch Data ---
    const fetchCosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await CostService.getAll({
                project_id: projectId,
                cost_category_id: costCategory.id,
                cost_group_id: costGroup.id,
                get_all: true, // Fetch all for DnD
                sort: 'position',
                direction: 'asc',
                search: globalFilter || undefined,
            });
            setData(res.data || []);
        } catch (e) {
            console.error(e);
            setError("Failed to load cost items.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchCosts(); 
    }, [projectId, costCategory.id, costGroup.id, globalFilter]);

    // --- Reorder Logic ---
    const handleRowDrop = async (draggingRow: MRT_Row<Cost>, targetRow: MRT_Row<Cost>) => {
        const newData = [...data];
        const draggedItem = newData.splice(draggingRow.index, 1)[0];
        newData.splice(targetRow.index, 0, draggedItem);
        setData(newData); // Optimistic

        try {
            const orderedIds = newData.map(item => item.id);
            await CostService.reorder(projectId, costCategory.id, costGroup.id, orderedIds);
        } catch (e) {
            console.error("Reorder failed", e);
            fetchCosts(); // Revert
        }
    };

    // --- Form Logic (Create/Edit) ---
    const handleOpenCreate = () => {
        setCurrentCost({ title: '', formula: '', state: '' });
        setCurrentValues([]); // Empty nested values
        setIsEditMode(false);
        setDialogOpen(true);
    };

    const handleOpenEdit = (cost: Cost) => {
        setCurrentCost({ ...cost });
        // Deep copy values to avoid mutating state directly
        setCurrentValues(cost.values ? cost.values.map(v => ({ ...v })) : []);
        setIsEditMode(true);
        setDialogOpen(true);
    };

    // Nested Values Handlers
    const addValueRow = () => {
        setCurrentValues([...currentValues, { value: 0, unit: '' }]);
    };
    
    const removeValueRow = (index: number) => {
        const newVals = [...currentValues];
        newVals.splice(index, 1);
        setCurrentValues(newVals);
    };

    const handleValueChange = (index: number, field: 'value' | 'unit', val: string | number) => {
        const newVals = [...currentValues];
        newVals[index] = { ...newVals[index], [field]: val };
        setCurrentValues(newVals);
    };

    const handleSubmit = async () => {
        if (!currentCost.title) return alert("Title and Amount are required");

        const payload = {
            title: currentCost.title,
            state: currentCost.state || '',
            formula: currentCost.formula || '',
            // Filter out empty rows and format for backend
            values: currentValues
                .filter(v => v.unit && v.unit.trim() !== '') // Ensure unit exists
                .map(v => ({ value: Number(v.value), unit: v.unit! }))
        };

        try {
            if (isEditMode && currentCost.id) {
                await CostService.update(projectId, costCategory.id, costGroup.id, currentCost.id, payload);
            } else {
                await CostService.create(projectId, costCategory.id, costGroup.id, payload);
            }
            setDialogOpen(false);
            fetchCosts();
        } catch (e) {
            console.error(e);
            alert("Operation failed");
        }
    };

    // --- Delete Logic ---
    const confirmDelete = async () => {
        if (!costToDelete) return;
        try {
            await CostService.delete(projectId, costCategory.id, costGroup.id, costToDelete.id);
            setDeleteDialogOpen(false);
            fetchCosts();
        } catch (e) {
            setError("Failed to delete.");
        }
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<Cost>[]>(
        () => [
            {
                accessorKey: 'title',
                header: 'Title',
                size: 250,
                Cell: ({ cell }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt color="action" fontSize="small" />
                        <Typography variant="body2" fontWeight={500}>{cell.getValue<string>()}</Typography>
                    </Box>
                )
            },
            {
                accessorKey: 'state',
                header: 'State',
                size: 80,
            },
            {
                accessorKey: 'amount',
                header: 'Amount',
                size: 120,
                Cell: ({ cell }) => (
                    <Typography variant="body2" fontFamily="monospace">
                        {Number(cell.getValue()).toLocaleString('en-US', { style: 'currency', currency: 'MYR' })}
                    </Typography>
                )
            },
            {
                accessorKey: 'formula',
                header: 'Formula',
                size: 150,
                Cell: ({ cell }) => <Typography variant="caption" color="textSecondary">{cell.getValue<string>()}</Typography>
            }
        ],
        []
    );

    const table = useMaterialReactTable({
        columns,
        data,
        
        // Disable pagination/sorting for DnD
        enableSorting: false,
        enablePagination: false,
        enableBottomToolbar: false,
        manualPagination: false,
        manualSorting: false,
        manualFiltering: true, // Keep filtering
        
        state: { 
            isLoading: loading, 
            showProgressBars: loading, 
            globalFilter 
        },
        onGlobalFilterChange: setGlobalFilter,

        // Drag & Drop
        enableRowOrdering: true,
        muiRowDragHandleProps: ({ table }) => ({
            onDragEnd: () => {
                const { draggingRow, hoveredRow } = table.getState();
                if (draggingRow && hoveredRow) {
                    handleRowDrop(draggingRow as MRT_Row<Cost>, hoveredRow as MRT_Row<Cost>);
                }
            },
        }),
        initialState: { density: 'compact' },

        enableRowActions: true,
        positionActionsColumn: 'last',
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                <Tooltip title="Edit">
                    <IconButton color="primary" onClick={() => handleOpenEdit(row.original)}>
                        <Edit />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => { setCostToDelete(row.original); setDeleteDialogOpen(true); }}>
                        <Delete />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
        renderTopToolbarCustomActions: () => (
            <Button startIcon={<Refresh />} onClick={fetchCosts} size="small">Refresh</Button>
        ),
    });

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5">Cost Items</Typography>
                    <Typography variant="caption" color="textSecondary">
                        Group: <strong>{costGroup.title}</strong> (Category: {costCategory.title})
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
                    Add Item
                </Button>
            </Box>
            
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
            
            <MaterialReactTable table={table} />

            {/* CREATE / EDIT DIALOG */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Cost Item' : 'Add Cost Item'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={12}>
                            <TextField 
                                label="Title" fullWidth required 
                                value={currentCost.title || ''} 
                                onChange={(e) => setCurrentCost({...currentCost, title: e.target.value})}
                            />
                        </Grid>
                        <Grid size={4}>
                            <TextField 
                                label="State" fullWidth placeholder="e.g. SGR"
                                value={currentCost.state || ''} 
                                onChange={(e) => setCurrentCost({...currentCost, state: e.target.value})}
                            />
                        </Grid>
                        <Grid size={4}>
                            <TextField 
                                label="Formula" fullWidth placeholder="e.g. GFA * Rate"
                                value={currentCost.formula || ''} 
                                onChange={(e) => setCurrentCost({...currentCost, formula: e.target.value})}
                            />
                        </Grid>

                        <Grid size={12}>
                            <Divider sx={{ my: 1 }}><Typography variant="caption" color="textSecondary">QUANTITY BREAKDOWN (OPTIONAL)</Typography></Divider>
                        </Grid>

                        {/* Nested Values Form */}
                        {currentValues.map((val, index) => (
                            <React.Fragment key={index}>
                                <Grid size={5}>
                                    <TextField 
                                        label="Value" type="number" size="small" fullWidth
                                        value={val.value}
                                        onChange={(e) => handleValueChange(index, 'value', e.target.value)}
                                    />
                                </Grid>
                                <Grid size={5}>
                                    <TextField 
                                        label="Unit" size="small" fullWidth placeholder="e.g. m2, units"
                                        value={val.unit || ''}
                                        onChange={(e) => handleValueChange(index, 'unit', e.target.value)}
                                    />
                                </Grid>
                                <Grid size={2} display="flex" alignItems="center">
                                    <IconButton size="small" color="error" onClick={() => removeValueRow(index)}>
                                        <RemoveCircleOutline />
                                    </IconButton>
                                </Grid>
                            </React.Fragment>
                        ))}
                        
                        <Grid size={12}>
                            <Button startIcon={<Add />} size="small" onClick={addValueRow}>
                                Add Quantity Row
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* DELETE DIALOG */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>Delete <strong>{costToDelete?.title}</strong>?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CostListWorkspace;