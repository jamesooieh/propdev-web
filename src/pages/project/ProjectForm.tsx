import React, { useEffect, useRef, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { isSystemRoot } from '../../services/auth';

// Services & Enums
import { ProjectService } from '../../services/project';
import { ProjectStatus, ProjectStatusLabels } from '../../enums';

// UI Components
import PageHeader from '../../components/common/PageHeader';
import {
    Container, Box, Typography, Button, Paper, TextField,
    MenuItem, Grid, CircularProgress, Alert, Divider
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { DeveloperSelect } from '../../components/common/DeveloperSelect';
import { LandMultiSelect } from '../../components/common/LandMultiSelect'; // Import the new component

const ProjectForm: React.FC = () => {
    const history = useHistory();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const { user } = useAuth();
    const isRoot = isSystemRoot(user);

    // --- Form Setup ---
    const {
        register, handleSubmit, control, setValue, reset, 
        formState: { errors }
    } = useForm({
        defaultValues: {
            developer_id: '',
            title: '',
            status: ProjectStatus.PLANNING, // Default value
            asp_no: '',
            do_no: '',
            bpa_no: '',
            land_ids: [] as number[], // Array for Multi-Select
        }
    });

    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Scroll-to-error logic
    const contentRef = useRef<HTMLIonContentElement>(null);
    useEffect(() => {
        if (submitError) {
            contentRef.current?.scrollToTop(500);
        }
    }, [submitError]);

    // --- Load Data ---
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            ProjectService.getById(id)
                .then(response => {
                    const actualData = response.data || response;

                    // TRANSFORM RELATIONSHIP: 
                    // Backend returns 'lands: [{id:1, lot:...}]'. 
                    // Form expects 'land_ids: [1, 2]'.
                    if (actualData.lands && Array.isArray(actualData.lands)) {
                        actualData.land_ids = actualData.lands.map((l: any) => l.id);
                    }

                    reset(actualData);

                    // Explicitly set developer_id for Root
                    if (isRoot && actualData.developer_id) {
                        setValue('developer_id', actualData.developer_id);
                    }
                })
                .catch(err => {
                    console.error(err);
                    setSubmitError("Could not load project details.");
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode, setValue, reset, isRoot]);

    // --- Submit ---
    const onSubmit = async (data: any) => {
        setLoading(true);
        setSubmitError(null);

        // Security Cleanup for Non-Root
        if (!isRoot) {
            delete data.developer_id;
        }

        try {
            if (isEditMode) {
                await ProjectService.update(id, data);
            } else {
                await ProjectService.create(data);
            }
            history.goBack();
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 422) {
                setSubmitError(err.response.data.message || "Validation Error");
            } else {
                setSubmitError("An error occurred while saving.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonContent fullscreen ref={contentRef}>
                <PageHeader title={isEditMode ? 'Edit Project' : 'Add Project'} showBackButton={true} />

                <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
                    <Container maxWidth="md">
                        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

                        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                            <form onSubmit={handleSubmit(onSubmit)}>

                                {/* SECTION 0: ROOT CONTROL */}
                                {isRoot && (
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle1" fontWeight="bold" color="secondary" sx={{ mb: 2 }}>
                                            System Admin Control
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12 }}>
                                                <DeveloperSelect
                                                    control={control}
                                                    name="developer_id"
                                                    label="Assign to Developer"
                                                    required={true}
                                                    rules={{ required: 'Developer is required for Root users' }}
                                                    error={!!errors.developer_id}
                                                    helperText={errors.developer_id?.message}
                                                    disabled={isEditMode}
                                                />
                                            </Grid>
                                        </Grid>
                                        <Divider sx={{ mt: 3 }} />
                                    </Box>
                                )}

                                {/* SECTION 1: CORE INFO */}
                                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                    Project Details
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Project Title"
                                            required
                                            {...register('title', { required: 'Title is required' })}
                                            error={!!errors.title}
                                            helperText={errors.title?.message}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    fullWidth
                                                    label="Status"
                                                    required
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                >
                                                    {Object.values(ProjectStatus).map(s => (
                                                        <MenuItem key={s} value={s}>{ProjectStatusLabels[s] || s}</MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                {/* SECTION 2: PERMITS */}
                                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                    Permits & References
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth label="ASP No."
                                            {...register('asp_no')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth label="DO No."
                                            {...register('do_no')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                {/* SECTION 3: LAND ASSIGNMENT */}
                                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                    Land Allocation
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12 }}>
                                        <LandMultiSelect 
                                            control={control}
                                            name="land_ids"
                                            label="Select Lands for this Project"
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                                    >
                                        {loading ? 'Saving...' : 'Save Project'}
                                    </Button>
                                </Box>
                            </form>
                        </Paper>
                    </Container>
                </Box>
            </IonContent>
        </IonPage>
    );
};

export default ProjectForm;