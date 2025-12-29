import React, { useState, useEffect } from 'react';
import {
    List, ListItemButton, ListItemText, ListItemIcon, Collapse,
    Box, Typography, CircularProgress, IconButton
} from '@mui/material';
import {
    ExpandLess, ExpandMore,
    Dashboard, Category as CategoryIcon, FolderOpen, FolderSpecial
} from '@mui/icons-material';
import { SelectionState } from '../ProjectDashboard';
import { CategoryService, Category } from '../../../services/category';
import { Group } from '../../../services/group';

interface ProjectExplorerProps {
    projectId: string;
    currentSelection: SelectionState;
    onSelect: (sel: SelectionState) => void;
    refreshTrigger: number;
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
    projectId, currentSelection, onSelect, refreshTrigger
}) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    // Controls which Category ID is expanded to show its groups
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // Main "Categories" root folder toggle
    const [rootCategoriesOpen, setRootCategoriesOpen] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        const fetchSidebarData = async () => {
            setLoading(true);
            try {
                // Ensure backend returns 'groups' relation when get_all is true!
                const res = await CategoryService.getAll({
                    project_id: projectId,
                    get_all: true
                });
                setCategories(res.data || []);
            } catch (error) {
                console.error("Failed to load explorer", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSidebarData();
    }, [projectId, refreshTrigger]);

    // Handle expanding a specific category to see its groups
    const toggleCategory = (catId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedCategories(prev => ({
            ...prev,
            [catId]: !prev[catId]
        }));
    };

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Typography variant="overline" color="textSecondary" fontWeight="bold">
                    Explorer
                </Typography>
            </Box>

            <List component="nav" dense>

                {/* 1. OVERVIEW */}
                <ListItemButton
                    selected={currentSelection.type === 'PROJECT_OVERVIEW'}
                    onClick={() => onSelect({ type: 'PROJECT_OVERVIEW' })}
                >
                    <ListItemIcon><Dashboard color="primary" /></ListItemIcon>
                    <ListItemText primary="Project Overview" />
                </ListItemButton>

                {/* 2. CATEGORIES ROOT */}
                <ListItemButton
                    selected={currentSelection.type === 'CATEGORY_LIST'}
                    onClick={() => onSelect({ type: 'CATEGORY_LIST' })}
                >
                    <ListItemIcon><CategoryIcon color="action" /></ListItemIcon>
                    <ListItemText primary="Categories" />
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setRootCategoriesOpen(!rootCategoriesOpen); }}
                    >
                        {rootCategoriesOpen ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </ListItemButton>

                {/* 3. CATEGORY LIST */}
                <Collapse in={rootCategoriesOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {categories.map((cat) => {
                            const isExpanded = !!expandedCategories[cat.id];

                            return (
                                <React.Fragment key={cat.id}>
                                    {/* Category Item */}
                                    <ListItemButton
                                        selected={currentSelection.type === 'CATEGORY_DETAIL' && currentSelection.data?.id === cat.id}
                                        onClick={() => onSelect({ type: 'CATEGORY_DETAIL', data: cat })}
                                        sx={{ pl: 4 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            <FolderOpen fontSize="small" color="action" />
                                        </ListItemIcon>

                                        <ListItemText
                                            primary={cat.title}
                                            primaryTypographyProps={{ noWrap: true, variant: 'body2', fontWeight: 500 }}
                                        />

                                        {/* Expand Arrow for Groups */}
                                        {cat.groups && cat.groups.length > 0 && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => toggleCategory(cat.id, e)}
                                                sx={{ p: 0.5 }}
                                            >
                                                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                            </IconButton>
                                        )}
                                    </ListItemButton>

                                    {/* Nested Groups List */}
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {cat.groups?.map((grp: Group) => (
                                                <ListItemButton
                                                    key={grp.id}
                                                    selected={currentSelection.type === 'GROUP_DETAIL' && currentSelection.data?.id === grp.id}
                                                    onClick={() => onSelect({ type: 'GROUP_DETAIL', data: { ...grp, category: cat } })} // Pass context
                                                    sx={{ pl: 8 }} // Indent deeper
                                                >
                                                    <ListItemIcon sx={{ minWidth: 24 }}>
                                                        <FolderSpecial fontSize="small" sx={{ fontSize: 16, color: '#757575' }} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={grp.title}
                                                        primaryTypographyProps={{ noWrap: true, variant: 'caption' }}
                                                    />
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    </Collapse>
                                </React.Fragment>
                            );
                        })}

                        {categories.length === 0 && !loading && (
                            <Typography variant="caption" sx={{ pl: 4, py: 1, display: 'block', color: 'text.secondary' }}>
                                No categories found
                            </Typography>
                        )}
                    </List>
                </Collapse>
            </List>
        </Box>
    );
};

export default ProjectExplorer;