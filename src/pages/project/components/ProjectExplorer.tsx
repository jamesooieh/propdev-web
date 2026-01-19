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
    MonetizationOn,
    AccountBalanceWallet,
    ReceiptLong,
} from '@mui/icons-material';
import { SelectionState } from '../ProjectDashboard';
import { CategoryService, Category } from '../../../services/category';
import { CostCategoryService, CostCategory } from '../../../services/costCategory';
import { Group } from '../../../services/group';
import { CostGroup } from '../../../services/costGroup';

interface ProjectExplorerProps {
    projectId: string;
    currentSelection: SelectionState;
    onSelect: (sel: SelectionState) => void;
    refreshTrigger: number;
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
    projectId, currentSelection, onSelect, refreshTrigger
}) => {
    const [devCategories, setDevCategories] = useState<Category[]>([]);
    const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
    const [loading, setLoading] = useState(false);

    // Toggle for Root Lists
    const [rootDevCategoriesOpen, setRootDevCategoriesOpen] = useState(true);
    const [rootCostCategoriesOpen, setRootCostCategoriesOpen] = useState(true);

    // 🆕 Split State: Separate expansion state for Dev vs Cost to avoid ID collisions
    const [expandedDevCats, setExpandedDevCats] = useState<Record<string, boolean>>({});
    const [expandedCostCats, setExpandedCostCats] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!projectId) return;

        const fetchSidebarData = async () => {
            setLoading(true);
            try {
                const [devRes, costRes] = await Promise.all([
                    CategoryService.getAll({
                        project_id: projectId,
                        get_all: true,
                        sort: 'title',
                        direction: 'asc',
                    }),
                    CostCategoryService.getAll({
                        project_id: projectId,
                        get_all: true, // 🔧 Backend must return 'groups' relation here
                        sort: 'position',
                        direction: 'asc',
                    }),
                ]);

                setDevCategories(devRes.data || []);
                setCostCategories(costRes.data || []);
            } catch (error) {
                console.error("Failed to load explorer", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSidebarData();
    }, [projectId, refreshTrigger]);

    // 🔧 Toggle Logic for Development Categories
    const toggleDevCat = (catId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedDevCats(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    // 🆕 Toggle Logic for Cost Categories
    const toggleCostCat = (catId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedCostCats(prev => ({ ...prev, [catId]: !prev[catId] }));
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

                {/* 2. DEVELOPMENT CATEGORIES ROOT */}
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

                {/* 3. DEVELOPMENT CATEGORY LIST */}
                <Collapse in={rootDevCategoriesOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {devCategories.map((cat) => {
                            // 🔧 Use specific Dev state
                            const isExpanded = !!expandedDevCats[cat.id];

                            return (
                                <React.Fragment key={cat.id}>
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
                                            slotProps={{ primary: { noWrap: true, variant: 'caption' } }}
                                        />
                                        {/* Expand Arrow */}
                                        {cat.groups && cat.groups.length > 0 && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => toggleDevCat(cat.id, e)} // 🔧 Use Dev Toggle
                                                sx={{ p: 0.5 }}
                                            >
                                                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                            </IconButton>
                                        )}
                                    </ListItemButton>

                                    {/* Nested Dev Groups */}
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
                    </List>
                </Collapse>

                {/* 4. COST CATEGORIES ROOT */}
                <ListItemButton
                    // @ts-ignore
                    selected={currentSelection.type === 'COST_CATEGORY_LIST'}
                    // @ts-ignore
                    onClick={() => onSelect({ type: 'COST_CATEGORY_LIST' })}
                >
                    <ListItemIcon><MonetizationOn color="secondary" /></ListItemIcon>
                    <ListItemText primary="Cost Categories" />
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setRootCostCategoriesOpen(!rootCostCategoriesOpen); }}
                    >
                        {rootCostCategoriesOpen ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </ListItemButton>

                {/* 5. COST CATEGORY LIST */}
                <Collapse in={rootCostCategoriesOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {costCategories.map((costCat) => {
                            // 🆕 Use specific Cost state
                            const isExpanded = !!expandedCostCats[costCat.id];

                            return (
                                <React.Fragment key={costCat.id}>
                                    <ListItemButton
                                        // @ts-ignore
                                        selected={currentSelection.type === 'COST_CATEGORY_DETAIL' && currentSelection.data?.id === costCat.id}
                                        // @ts-ignore
                                        onClick={() => onSelect({ type: 'COST_CATEGORY_DETAIL', data: costCat })}
                                        sx={{ pl: 4 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            <AccountBalanceWallet fontSize="small" color="action" />
                                        </ListItemIcon>
                                        <ListItemText
                                            disableTypography
                                            primary={<Typography variant="caption" noWrap>{costCat.title}</Typography>}
                                        />
                                        
                                        {/* 🆕 Toggle Button for Cost Category */}
                                        {costCat.groups && costCat.groups.length > 0 && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => toggleCostCat(costCat.id, e)} // 🆕 Use Cost Toggle
                                                sx={{ p: 0.5 }}
                                            >
                                                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                            </IconButton>
                                        )}
                                    </ListItemButton>

                                    {/* 🆕 Nested Cost Groups */}
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {costCat.groups?.map((grp: CostGroup) => (
                                                <ListItemButton
                                                    key={grp.id}
                                                    // @ts-ignore - Ensure Dashboard has 'COST_GROUP_DETAIL'
                                                    selected={currentSelection.type === 'COST_GROUP_DETAIL' && currentSelection.data?.id === grp.id}
                                                    // 🆕 Pass Group AND Parent Category Data
                                                    // @ts-ignore
                                                    onClick={() => onSelect({ type: 'COST_GROUP_DETAIL', data: { ...grp, category: costCat } })}
                                                    sx={{ pl: 8 }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 24 }}>
                                                        <ReceiptLong fontSize="small" sx={{ fontSize: 16, color: '#757575' }} />
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
                        
                        {costCategories.length === 0 && !loading && (
                            <Typography variant="caption" sx={{ pl: 4, py: 1, display: 'block', color: 'text.secondary' }}>
                                No cost categories found
                            </Typography>
                        )}
                    </List>
                </Collapse>

            </List>
        </Box>
    );
};

export default ProjectExplorer;