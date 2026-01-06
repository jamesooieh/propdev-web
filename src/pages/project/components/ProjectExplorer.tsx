import React, { useState, useEffect } from 'react';
import {
    List, ListItemButton, ListItemText, ListItemIcon, Collapse,
    Box, Typography, IconButton
} from '@mui/material';
import {
    ExpandLess, ExpandMore,
    Dashboard,
    Category as CategoryIcon,
    FolderOpen,
    FolderSpecial,
    MonetizationOn // NEW: Icon for Cost Categories
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

    // Toggle for the "Development Categories" list
    const [rootDevCategoriesOpen, setRootDevCategoriesOpen] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        const fetchSidebarData = async () => {
            setLoading(true);
            try {
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

                {/* 1. PROJECT OVERVIEW */}
                <ListItemButton
                    selected={currentSelection.type === 'PROJECT_OVERVIEW'}
                    onClick={() => onSelect({ type: 'PROJECT_OVERVIEW' })}
                >
                    <ListItemIcon><Dashboard color="primary" /></ListItemIcon>
                    <ListItemText primary="Project Overview" />
                </ListItemButton>

                {/* 2. DEVELOPMENT CATEGORIES ROOT (Renamed) */}
                <ListItemButton
                    selected={currentSelection.type === 'CATEGORY_LIST'}
                    onClick={() => onSelect({ type: 'CATEGORY_LIST' })}
                >
                    <ListItemIcon><CategoryIcon color="warning" /></ListItemIcon>
                    <ListItemText primary="Development Categories" />
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setRootDevCategoriesOpen(!rootDevCategoriesOpen); }}
                    >
                        {rootDevCategoriesOpen ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </ListItemButton>

                {/* 3. DEVELOPMENT CATEGORY LIST (Hierarchy) */}
                <Collapse in={rootDevCategoriesOpen} timeout="auto" unmountOnExit>
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
                                            slotProps={{
                                                primary: { noWrap: true, variant: 'caption' }
                                            }}
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
                                                    onClick={() => onSelect({ type: 'GROUP_DETAIL', data: { ...grp, category: cat } })}
                                                    sx={{ pl: 8 }}
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

                {/* 4. COST CATEGORIES (NEW) */}
                {/* This opens the Cost Category List Workspace */}
                <ListItemButton
                    // @ts-ignore - Ensure 'COST_CATEGORY_LIST' is added to your SelectionType in Dashboard
                    selected={currentSelection.type === 'COST_CATEGORY_LIST'}
                    // @ts-ignore
                    onClick={() => onSelect({ type: 'COST_CATEGORY_LIST' })}
                >
                    <ListItemIcon><MonetizationOn color="secondary" /></ListItemIcon>
                    <ListItemText primary="Cost Categories" />
                </ListItemButton>


            </List>
        </Box>
    );
};

export default ProjectExplorer;