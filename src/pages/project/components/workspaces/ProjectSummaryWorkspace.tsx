import React from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { Project } from '../../../../services/project';
import { ProjectStatusLabels } from '../../../../enums';

const ProjectSummaryWorkspace: React.FC<{ project: Project }> = ({ project }) => {
    return (
        <Box>
            <Typography variant="h5" gutterBottom>Project Overview</Typography>
            
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="textSecondary">Project Details</Typography>
                        <Typography variant="h6" sx={{ mt: 1 }}>{project.title}</Typography>
                        <Box sx={{ mt: 2 }}>
                             <Chip label={ProjectStatusLabels[project.status]} color="primary" variant="outlined" />
                        </Box>
                        
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body2"><strong>ASP No:</strong> {project.asp_no || '-'}</Typography>
                            <Typography variant="body2"><strong>DO No:</strong> {project.do_no || '-'}</Typography>
                            <Typography variant="body2"><strong>BPA No:</strong> {project.bpa_no || '-'}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="subtitle2" color="textSecondary">Lands Allocated</Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>{project.lands?.length || 0}</Typography>
                        <Typography variant="caption" color="textSecondary">Total lots assigned</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProjectSummaryWorkspace;