import React, { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { ProjectService, Project } from '../../services/project';
import { Box, Grid, Skeleton, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';

// Components
import ProjectExplorer from './components/ProjectExplorer';
import ProjectSummaryWorkspace from './components/workspaces/ProjectSummaryWorkspace';
import CategoryListWorkspace from './components/workspaces/CategoryListWorkspace';
import CategoryCreateWorkspace from './components/workspaces/CategoryCreateWorkspace'; // New component

// UPDATED TYPES
export type SelectionType = 
    | 'PROJECT_OVERVIEW' 
    | 'CATEGORY_CREATE' 
    | 'CATEGORY_VIEW' 
    | 'CATEGORY_MANAGE';

export interface SelectionState {
    type: SelectionType;
    data?: any; // For passing extra data if needed
}

const ProjectDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    // Default selection
    const [selection, setSelection] = useState<SelectionState>({ type: 'PROJECT_OVERVIEW' });

    useEffect(() => {
        if (id) {
            ProjectService.getById(id)
                .then(res => setProject(res.data || res))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading || !project) {
        return (
            <IonPage>
                <IonContent>
                    <Box p={4}><Skeleton variant="rectangular" height={400} /></Box>
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
                
                <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                    <Grid container sx={{ height: '100%' }}>
                        
                        {/* LEFT SIDEBAR: STATIC MENU */}
                        <Grid size={{ xs: 12, md: 3 }} sx={{ borderRight: '1px solid #e0e0e0', bgcolor: '#fff', height: '100%', overflowY: 'auto' }}>
                            <ProjectExplorer 
                                currentSelection={selection}
                                onSelect={setSelection}
                            />
                        </Grid>

                        {/* RIGHT PANE: DYNAMIC WORKSPACE */}
                        <Grid size={{ xs: 12, md: 9 }} sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
                            
                            {selection.type === 'PROJECT_OVERVIEW' && (
                                <ProjectSummaryWorkspace project={project} />
                            )}

                            {selection.type === 'CATEGORY_CREATE' && (
                                <CategoryCreateWorkspace 
                                    projectId={project.id} 
                                    onSuccess={() => setSelection({ type: 'CATEGORY_MANAGE' })}
                                />
                            )}

                            {selection.type === 'CATEGORY_VIEW' && (
                                <CategoryListWorkspace 
                                    projectId={project.id} 
                                    mode="VIEW" 
                                />
                            )}

                            {selection.type === 'CATEGORY_MANAGE' && (
                                <CategoryListWorkspace 
                                    projectId={project.id} 
                                    mode="MANAGE" 
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