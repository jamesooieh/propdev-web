import React, { useState } from 'react';
import { 
    List, ListItemButton, ListItemText, ListItemIcon, Collapse, 
    Box, Typography 
} from '@mui/material';
import { 
    ExpandLess, ExpandMore, 
    Dashboard, Category as CategoryIcon, 
    AddCircleOutline, ListAlt, Settings 
} from '@mui/icons-material';
import { SelectionState } from '../ProjectDashboard';

interface ProjectExplorerProps {
    currentSelection: SelectionState;
    onSelect: (sel: SelectionState) => void;
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ currentSelection, onSelect }) => {
    // State to toggle the "Categories" folder
    const [categoriesOpen, setCategoriesOpen] = useState(false);

    const handleToggleCategories = () => {
        setCategoriesOpen(!categoriesOpen);
    };

    return (
        <Box sx={{ pb: 4 }}>
            {/* Explorer Header */}
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Typography variant="overline" color="textSecondary" fontWeight="bold">
                    Menu
                </Typography>
            </Box>

            <List component="nav" dense>
                
                {/* 1. PROJECT OVERVIEW */}
                <ListItemButton 
                    selected={currentSelection.type === 'PROJECT_OVERVIEW'}
                    onClick={() => onSelect({ type: 'PROJECT_OVERVIEW' })}
                >
                    <ListItemIcon><Dashboard color="primary" /></ListItemIcon>
                    <ListItemText primary="Project Overview" />
                </ListItemButton>

                {/* 2. CATEGORIES FOLDER */}
                <ListItemButton onClick={handleToggleCategories}>
                    <ListItemIcon><CategoryIcon color="action" /></ListItemIcon>
                    <ListItemText primary="Categories" />
                    {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={categoriesOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        
                        {/* 2.1 CREATE CATEGORY */}
                        <ListItemButton 
                            selected={currentSelection.type === 'CATEGORY_CREATE'}
                            onClick={() => onSelect({ type: 'CATEGORY_CREATE' })}
                            sx={{ pl: 4 }}
                        >
                            <ListItemIcon><AddCircleOutline fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Create Category" />
                        </ListItemButton>

                        {/* 2.2 VIEW CATEGORIES */}
                        <ListItemButton 
                            selected={currentSelection.type === 'CATEGORY_VIEW'}
                            onClick={() => onSelect({ type: 'CATEGORY_VIEW' })}
                            sx={{ pl: 4 }}
                        >
                            <ListItemIcon><ListAlt fontSize="small" /></ListItemIcon>
                            <ListItemText primary="View Categories" />
                        </ListItemButton>

                        {/* 2.3 MANAGE CATEGORIES */}
                        <ListItemButton 
                            selected={currentSelection.type === 'CATEGORY_MANAGE'}
                            onClick={() => onSelect({ type: 'CATEGORY_MANAGE' })}
                            sx={{ pl: 4 }}
                        >
                            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Manage Categories" />
                        </ListItemButton>

                    </List>
                </Collapse>

            </List>
        </Box>
    );
};

export default ProjectExplorer;