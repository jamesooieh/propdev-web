import React, { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { ProjectService, Project } from '../../services/project';
import { Container, Box, Grid, Skeleton, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';

// Sub-components
import ProjectExplorer from './components/ProjectExplorer';
import CategoryWorkspace from './components/workspaces/CategoryWorkspace';
import GroupWorkspace from './components/workspaces/GroupWorkspace';
import ProjectSummaryWorkspace from './components/workspaces/ProjectSummaryWorkspace';

// Types
export type SelectionType = 'PROJECT' | 'CATEGORY' | 'GROUP';

export interface SelectionState {
    type: SelectionType;
    id: string; 
    data?: { title: string }; // We cache the title here for header display
}

const ProjectDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    // Default selection is the Project itself
    const [selection, setSelection] = useState<SelectionState>({ type: 'PROJECT', id: '' });
    
    // Trigger to refresh the sidebar tree when actions happen in the workspace
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        if (id) {
            setSelection({ type: 'PROJECT', id }); 
            ProjectService.getById(id)
                .then(res => setProject(res.data || res))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

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
                    showBackButton={true} // We implement custom back button
                />
                
                <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                    <Grid container sx={{ height: '100%' }}>
                        
                        {/* LEFT SIDEBAR: EXPLORER TREE */}
                        <Grid size={{ xs: 12, md: 3 }} sx={{ borderRight: '1px solid #e0e0e0', bgcolor: '#fff', height: '100%', overflowY: 'auto' }}>
                            <ProjectExplorer 
                                projectId={project.id}
                                currentSelection={selection}
                                onSelect={setSelection}
                                refreshTrigger={refreshTrigger}
                            />
                        </Grid>

                        {/* RIGHT PANE: WORKSPACE */}
                        <Grid size={{ xs: 12, md: 9 }} sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
                            
                            {selection.type === 'PROJECT' && (
                                <ProjectSummaryWorkspace project={project} />
                            )}

                            {selection.type === 'CATEGORY' && (
                                <CategoryWorkspace 
                                    categoryId={selection.id} 
                                    categoryTitle={selection.data?.title}
                                    onUpdate={handleRefresh}
                                />
                            )}

                            {selection.type === 'GROUP' && (
                                <GroupWorkspace 
                                    groupId={selection.id} 
                                    groupTitle={selection.data?.title}
                                    onUpdate={handleRefresh}
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