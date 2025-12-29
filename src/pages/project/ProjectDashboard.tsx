import React, { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { Box, Grid, Typography, CircularProgress } from '@mui/material';

// Services
import { ProjectService, Project } from '../../services/project';

// Components
import PageHeader from '../../components/common/PageHeader';
import ProjectExplorer from './components/ProjectExplorer';
import CategoryListWorkspace from './components/workspaces/CategoryListWorkspace';
import ProjectSummaryWorkspace from './components/workspaces/ProjectSummaryWorkspace';
import GroupListWorkspace from './components/workspaces/GroupListWorkspace';
import TypeListWorkspace from './components/workspaces/TypeListWorkspace';
// import ProjectSummaryWorkspace from './components/workspaces/ProjectSummaryWorkspace'; 

// --- TYPES ---
export type SelectionType = 
    | 'PROJECT_OVERVIEW' 
    | 'CATEGORY_LIST' 
    | 'CATEGORY_DETAIL'
    | 'GROUP_DETAIL';   // View Types in a Group <--- NEW 

export interface SelectionState {
    type: SelectionType;
    data?: any; 
}

const ProjectDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    
    // --- State ---
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    // Selection State (Default to Overview)
    const [selection, setSelection] = useState<SelectionState>({ type: 'PROJECT_OVERVIEW' });

    // Sidebar Refresh Token
    const [refreshSidebarToken, setRefreshSidebarToken] = useState(0);

    // --- Initial Load ---
    useEffect(() => {
        if (id) {
            setLoading(true);
            ProjectService.getById(id)
                .then(res => setProject(res.data || res))
                .catch(err => console.error("Failed to load project", err))
                .finally(() => setLoading(false));
        }
    }, [id]);

    // --- Helper to Refresh Sidebar ---
    const refreshSidebar = () => {
        setRefreshSidebarToken(prev => prev + 1);
    };

    if (loading) {
        return (
            <IonPage>
                <IonContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <CircularProgress />
                    </Box>
                </IonContent>
            </IonPage>
        );
    }

    if (!project) {
        return (
            <IonPage>
                <IonContent>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" color="error">Project not found.</Typography>
                    </Box>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonContent fullscreen>
                <PageHeader 
                    title={project.title} 
                    showBackButton={true}
                    onBack={() => history.push('/projects')}
                />
                
                {/* Main Layout Area */}
                <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                    
                    {/* MUI v7 Grid2 Syntax */}
                    <Grid container sx={{ height: '100%' }}>
                        
                        {/* LEFT SIDEBAR (Explorer) */}
                        <Grid size={{ xs: 12, md: 3 }} sx={{ borderRight: '1px solid #e0e0e0', bgcolor: '#fff', height: '100%', overflowY: 'auto' }}>
                            <ProjectExplorer 
                                projectId={project.id}
                                currentSelection={selection}
                                onSelect={setSelection}
                                refreshTrigger={refreshSidebarToken}
                            />
                        </Grid>

                        {/* RIGHT PANE (Workspaces) */}
                        <Grid size={{ xs: 12, md: 9 }} sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
                            
                            {/* 1. PROJECT OVERVIEW */}
                            {selection.type === 'PROJECT_OVERVIEW' && (
                                <ProjectSummaryWorkspace project={project} />
                            )}

                            {/* 2. CATEGORY LIST (Manage) */}
                            {selection.type === 'CATEGORY_LIST' && (
                                <CategoryListWorkspace 
                                    projectId={project.id} 
                                    onSelectCategory={(cat) => setSelection({ type: 'CATEGORY_DETAIL', data: cat })}
                                    onCategoryChange={refreshSidebar}
                                />
                            )}

                            {/* 3. CATEGORY DETAIL (Groups) */}
                            {selection.type === 'CATEGORY_DETAIL' && selection.data && (
                                <GroupListWorkspace 
                                    projectId={project.id} 
                                    category={selection.data} // Pass the full category object
                                    onSelectGroup={(group) => setSelection({ type: 'GROUP_DETAIL', data: group })}
                                />
                            )}

                            {/* 4. GROUP DETAIL (Show Types) --- NEW */}
                            {selection.type === 'GROUP_DETAIL' && selection.data && (
                                <TypeListWorkspace 
                                    projectId={project.id}
                                    group={selection.data}
                                    onBack={() => setSelection({ 
                                        type: 'CATEGORY_DETAIL', 
                                        // We need to pass the category back if we want the back button to work perfectly.
                                        // Ideally, the group object should have the category loaded, or we store it in state.
                                        // For now, simple back logic:
                                        data: selection.data.category // Assuming Group object has 'category' relation loaded
                                    })}
                                />
                            )}

                        </Grid>
                    </Grid>
                </Box>
            </IonContent>
        </IonPage>
    );
};

export default ProjectDashboard;