import React, { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { isSystemRoot } from '../../services/auth';

// Services
import { LandService } from '../../services/land';
import { DeveloperService, Developer } from '../../services/developer';

// Enums
import {
    LandStatus, LandStatusLabels,
    LandTenureType, LandTenureTypeLabels,
    MalaysiaState, MalaysiaStateLabels
} from '../../enums';

// UI Components
import PageHeader from '../../components/common/PageHeader';
import {
    Container, Box, Typography, Button, Paper, TextField,
    MenuItem, Grid, CircularProgress, Alert, Divider
} from '@mui/material'; // Ensure this uses the latest Grid (v2) if using MUI 6+
import { Save } from '@mui/icons-material';
import { DeveloperSelect } from '../../components/common/DeveloperSelect';

const LandForm: React.FC = () => {
    const history = useHistory();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const { user } = useAuth();
    const isRoot = isSystemRoot(user);

    // --- Form Setup ---
    const {
        register, handleSubmit, control, setValue, watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            developer_id: '',
            status: LandStatus.ACQUIRED,
            lot: '',
            size: '',
            sheet: '',
            section: '',
            town: '',
            district: '',
            state: MalaysiaState.SELANGOR,
            tenure_type: LandTenureType.FREEHOLD,
            lease_duration: '',
            lease_expiry: '',
            expressed_condition: '',
            implied_condition: '',
            zoning: '',
            density: '',
            plot_ratio: '',
            development_class: '',
            development_type: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const tenureType = watch('tenure_type');
    const isLeasehold = tenureType === LandTenureType.LEASEHOLD;

    // --- Load Land Data ---
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            LandService.getById(id)
                .then(data => {
                    Object.keys(data).forEach(key => setValue(key as any, data[key]));
                    if (isRoot && data.developer_id) {
                        setValue('developer_id', data.developer_id);
                    }
                })
                .catch(err => setSubmitError("Could not load land details."))
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode, setValue, isRoot]);

    // --- Submit ---
    const onSubmit = async (data: any) => {
        setLoading(true);
        setSubmitError(null);

        // Validation cleanup: Clear lease data if Freehold
        if (data.tenure_type !== LandTenureType.LEASEHOLD) {
            data.lease_duration = null;
            data.lease_expiry = null;
        }

        try {
            if (isEditMode) {
                await LandService.update(id, data);
            } else {
                await LandService.create(data);
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
            <IonContent fullscreen>
                <PageHeader title={isEditMode ? 'Edit Land' : 'Add Land'} showBackButton={true} />

                <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
                    <Container maxWidth="md">
                        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

                        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                            <form onSubmit={handleSubmit(onSubmit)}>

                                {/* --- SECTION 0: ROOT DEVELOPER SELECT --- */}
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
                                                />
                                            </Grid>
                                        </Grid>
                                        <Divider sx={{ mt: 3 }} />
                                    </Box>
                                )}



                                {/* --- SECTION 1: LOCATION --- */}
                                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                    Location
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Controller
                                            name="state"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    fullWidth
                                                    label="State (Negeri)"
                                                    required
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                >
                                                    {Object.values(MalaysiaState).map(s => (
                                                        <MenuItem key={s} value={s}>{MalaysiaStateLabels[s]}</MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <TextField
                                            fullWidth label="District (Daerah)"
                                            {...register('district')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <TextField
                                            fullWidth label="Town/Mukim (Bandar/Pekan/Mukim)" required
                                            {...register('town', { required: 'Town is required' })}
                                            error={!!errors.town} helperText={errors.town?.message}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 12 }}>
                                        <TextField
                                            fullWidth label="Section (Seksyen)"
                                            {...register('section')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                {/* --- SECTION 2: LOT INFO --- */}
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                        Lot Information
                                    </Typography>
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <TextField
                                            fullWidth label="Lot No (No Lot)" required
                                            {...register('lot', { required: 'Lot number is required' })}
                                            error={!!errors.lot} helperText={errors.lot?.message}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 6 }}>
                                        <TextField
                                            fullWidth label="Lot Area (Luas Lot) (square metre)"
                                            {...register('size')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 6 }}>
                                        <TextField
                                            fullWidth label="Standard Sheet No (No Lembaran Piawai)"
                                            {...register('sheet')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                {/* --- SECTION 3: TENURE (CONDITIONAL) --- */}
                                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                    Tenure Information
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Controller
                                            name="tenure_type"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    fullWidth
                                                    label="Tenure Type"
                                                    required
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                >
                                                    {Object.values(LandTenureType).map(t => (
                                                        <MenuItem key={t} value={t}>{LandTenureTypeLabels[t]}</MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                    </Grid>

                                    {/* Conditional: Lease Details */}
                                    <Grid size={{ xs: 6, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            label="Lease Duration (Years)"
                                            type="number"
                                            disabled={!isLeasehold}
                                            {...register('lease_duration', {
                                                required: isLeasehold ? 'Duration required for Leasehold' : false,
                                                min: { value: 1, message: 'Must be positive' }
                                            })}
                                            error={!!errors.lease_duration}
                                            helperText={errors.lease_duration?.message}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 4 }}>
                                        <TextField
                                            fullWidth
                                            label="Expiry Year"
                                            type="number"
                                            placeholder="YYYY"
                                            disabled={!isLeasehold}
                                            {...register('lease_expiry', {
                                                required: isLeasehold ? 'Expiry required for Leasehold' : false,
                                                min: { value: new Date().getFullYear(), message: 'Cannot be in the past' },
                                                pattern: { value: /^\d{4}$/, message: 'Must be 4 digits (YYYY)' }
                                            })}
                                            error={!!errors.lease_expiry}
                                            helperText={errors.lease_expiry?.message}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                {/* --- SECTION 3: STATUS DETAILS --- */}
                                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                    Status
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 4 }}>
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
                                                    {Object.values(LandStatus).map(s => (
                                                        <MenuItem key={s} value={s}>{LandStatusLabels[s]}</MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                {/* --- SECTION 4: CONDITIONS & PLANNING --- */}
                                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                    Planning & Conditions
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth multiline rows={2}
                                            label="Expressed Condition (Syarat-syarat Nyata)"
                                            {...register('expressed_condition')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField
                                            fullWidth label="Zoning"
                                            {...register('zoning')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 4 }}>
                                        <TextField
                                            fullWidth label="Density"
                                            {...register('density')}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 4 }}>
                                        <TextField
                                            fullWidth label="Plot Ratio"
                                            {...register('plot_ratio')}
                                            slotProps={{ inputLabel: { shrink: true } }}
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
                                        {loading ? 'Saving...' : 'Save Record'}
                                    </Button>
                                </Box>
                            </form>
                        </Paper>
                    </Container>
                </Box>
            </IonContent>
        </IonPage >
    );
};

export default LandForm;