import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { GroupService } from '../../../../services/group';
import { CategoryService } from '../../../../services/category';
import { GroupStatus } from '../../../../enums';

interface CategoryWorkspaceProps {
    categoryId: string;
    categoryTitle?: string;
    onUpdate: () => void; // Call this to refresh the sidebar
}

const CategoryWorkspace: React.FC<CategoryWorkspaceProps> = ({ categoryId, categoryTitle, onUpdate }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [groupTitle, setGroupTitle] = useState('');

    const handleCreateGroup = async () => {
        if (!groupTitle) return;
        try {
            await GroupService.create({ 
                category_id: categoryId, 
                title: groupTitle,
                status: GroupStatus.ACTIVE 
            });
            setDialogOpen(false);
            setGroupTitle('');
            alert("Group Created");
            onUpdate(); // Refresh sidebar
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteCategory = async () => {
        if (confirm(`Delete Category "${categoryTitle}" and all its groups?`)) {
            await CategoryService.delete(categoryId);
            onUpdate();
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Category: {categoryTitle}</Typography>
                <Box>
                    <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDeleteCategory} sx={{ mr: 1 }}>
                        Delete
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
                        New Group
                    </Button>
                </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="h6" gutterBottom>Manage Groups</Typography>
                <Typography variant="body2">
                    Use the button above to add Groups to this Category.
                    <br />
                    Select a Group from the sidebar to manage detailed inventory.
                </Typography>
            </Paper>

            {/* Create Group Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>New Group</DialogTitle>
                <DialogContent>
                    <TextField 
                        autoFocus margin="dense" label="Group Title" fullWidth 
                        value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateGroup}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CategoryWorkspace;