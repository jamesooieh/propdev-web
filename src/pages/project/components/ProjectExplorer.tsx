import React, { useEffect, useState } from 'react';
import { 
    List, ListItemButton, ListItemText, ListItemIcon, Collapse, 
    Box, Typography, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button
} from '@mui/material';
import { 
    ExpandLess, ExpandMore, Folder, FolderOpen, 
    Dashboard, Category as CategoryIcon, AddCircleOutline 
} from '@mui/icons-material';
import { CategoryService, Category } from '../../../services/category';
import { SelectionState } from '../ProjectDashboard';
import { CategoryStatus } from '../../../enums';

interface ProjectExplorerProps {
    projectId: string;
    currentSelection: SelectionState;
    onSelect: (sel: SelectionState) => void;
    refreshTrigger: number; // Used to reload tree from parent
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ projectId, currentSelection, onSelect, refreshTrigger }) => {
    const [treeData, setTreeData] = useState<Category[]>([]);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    
    // Create Dialog State
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');

    const loadTree = async () => {
        try {
            // NOTE: Backend must return Nested Groups: Project::with('categories.groups')
            const res = await CategoryService.getAll({ project_id: projectId });
            setTreeData(res.data || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { loadTree(); }, [projectId, refreshTrigger]);

    const toggleCategory = (catId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const handleCreateCategory = async () => {
        if (!newCategoryTitle.trim()) return;
        try {
            await CategoryService.create({ 
                project_id: projectId, 
                title: newCategoryTitle,
                status: CategoryStatus.ACTIVE 
            });
            setCreateDialogOpen(false);
            setNewCategoryTitle('');
            loadTree(); // Refresh tree
        } catch (e) {
            alert("Failed to create category");
        }
    };

    return (
        <Box sx={{ pb: 4 }}>
            {/* Explorer Header */}
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="overline" color="textSecondary" fontWeight="bold">
                    Explorer
                </Typography>
                <Tooltip title="New Category">
                    <IconButton size="small" onClick={() => setCreateDialogOpen(true)}>
                        <AddCircleOutline fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
            </Box>

            <List component="nav" dense>
                
                {/* 1. ROOT PROJECT NODE */}
                <ListItemButton 
                    selected={currentSelection.type === 'PROJECT'}
                    onClick={() => onSelect({ type: 'PROJECT', id: projectId })}
                >
                    <ListItemIcon><Dashboard color="primary" /></ListItemIcon>
                    <ListItemText primary="Project Overview" />
                </ListItemButton>

                {/* 2. CATEGORIES */}
                {treeData.map((cat) => (
                    <React.Fragment key={cat.id}>
                        <ListItemButton 
                            selected={currentSelection.type === 'CATEGORY' && currentSelection.id === cat.id}
                            onClick={() => onSelect({ type: 'CATEGORY', id: cat.id, data: { title: cat.title } })}
                            sx={{ pl: 2 }}
                        >
                            <ListItemIcon onClick={(e) => toggleCategory(cat.id, e)}>
                                {openCategories[cat.id] ? <FolderOpen color="action" /> : <Folder color="action" />}
                            </ListItemIcon>
                            <ListItemText primary={cat.title} primaryTypographyProps={{ fontWeight: 500 }} />
                            {openCategories[cat.id] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                        </ListItemButton>

                        {/* 3. NESTED GROUPS */}
                        <Collapse in={openCategories[cat.id]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {cat.groups?.map((group) => (
                                    <ListItemButton 
                                        key={group.id}
                                        selected={currentSelection.type === 'GROUP' && currentSelection.id === group.id}
                                        onClick={() => onSelect({ type: 'GROUP', id: group.id, data: { title: group.title } })}
                                        sx={{ pl: 6 }} 
                                    >
                                        <ListItemIcon sx={{ minWidth: 30 }}>
                                            <CategoryIcon fontSize="small" sx={{ fontSize: 16 }} />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={group.title} 
                                            primaryTypographyProps={{ variant: 'body2' }} 
                                        />
                                    </ListItemButton>
                                ))}
                                {(!cat.groups || cat.groups.length === 0) && (
                                    <Typography variant="caption" sx={{ pl: 6, py: 1, display: 'block', color: 'text.disabled' }}>
                                        No groups
                                    </Typography>
                                )}
                            </List>
                        </Collapse>
                    </React.Fragment>
                ))}
            </List>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>New Category</DialogTitle>
                <DialogContent>
                    <TextField 
                        autoFocus margin="dense" label="Category Title" fullWidth 
                        value={newCategoryTitle} onChange={(e) => setNewCategoryTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateCategory}>Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectExplorer;