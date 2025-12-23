import React, { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { DeveloperService } from '../../services/developer';
import PageHeader from '../../components/common/PageHeader';

// Import Enums and Labels
import {
    DeveloperStatus, DeveloperStatusLabels,
    Country, getCountryLabel,
    MalaysiaState, MalaysiaStateLabels
} from '../../enums';

// MUI Imports
import {
    Container, Box, Typography, Button, Paper, TextField,
    MenuItem, Grid, CircularProgress, Alert
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';

const DeveloperForm: React.FC = () => {
    const history = useHistory();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            status: DeveloperStatus.ACTIVE,
            reg_no: '',
            license_no: '',
            contact_person: '',
            email: '',
            phone_mobile: '',
            phone_office: '',
            phone_other: '',
            street_l1: '',
            street_l2: '',
            street_l3: '',
            city: '',
            postcode: '',
            state: '',
            country: Country.MALAYSIA
        }
    });

    const selectedCountry = watch('country');
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Load Data if Edit Mode
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            DeveloperService.getById(id)
                .then(data => {
                    Object.keys(data).forEach(key => {
                        setValue(key as any, data[key]);
                    });
                })
                .catch(err => setSubmitError("Could not load developer details."))
                .finally(() => setLoading(false));
        }
    }, [id, isEditMode, setValue]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        setSubmitError(null);
        try {
            if (isEditMode) {
                await DeveloperService.update(id, data);
            } else {
                await DeveloperService.create(data);
            }
            history.replace('/developers');
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 422) {
                const msg = err.response.data.message || "Validation Error";
                setSubmitError(msg);
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

                {/* Header with Back Button enabled */}
                <PageHeader
                    title={isEditMode ? 'Edit Developer' : 'Create Developer'}
                    showBackButton={true}
                />

                <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
                    <Container maxWidth="md">

                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Button startIcon={<ArrowBack />} onClick={() => history.goBack()} sx={{ mr: 2 }}>
                                Back
                            </Button>
                            <Typography variant="h5" fontWeight="bold">
                                {isEditMode ? 'Edit Developer' : 'Create Developer'}
                            </Typography>
                        </Box>

                        {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

                        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                            <form onSubmit={handleSubmit(onSubmit)}>

                                {/* SECTION 1: CORE INFO */}
                                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Company Details</Typography>

                                <Grid container spacing={2}>
                                    {/* 1. NAME - REQUIRED */}
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <TextField
                                            fullWidth
                                            required // <--- VISUAL ASTERISK
                                            label="Company Name"
                                            error={!!errors.name}
                                            helperText={errors.name?.message}
                                            {...register('name', { required: 'Company Name is required' })}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField fullWidth label="Company Registration No" {...register('reg_no')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField fullWidth label="Developer License No" {...register('license_no')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>

                                    {/* 2. STATUS - REQUIRED */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="status"
                                            control={control}
                                            rules={{ required: 'Status is required' }}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    select
                                                    fullWidth
                                                    required // <--- VISUAL ASTERISK
                                                    label="Status"
                                                    error={!!errors.status}
                                                    slotProps={{ inputLabel: { shrink: true } }}
                                                >
                                                    {Object.values(DeveloperStatus).map((status) => (
                                                        <MenuItem key={status} value={status}>
                                                            {DeveloperStatusLabels[status]}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                {/* SECTION 2: CONTACT */}
                                <Typography variant="h6" sx={{ mt: 4, mb: 2, color: 'primary.main' }}>Contact Info</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <TextField fullWidth label="Contact Person" {...register('contact_person')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            type="email"
                                            {...register('email', {
                                                pattern: {
                                                    value: /^\S+@\S+$/i,
                                                    message: "Invalid email format"
                                                }
                                            })}
                                            error={!!errors.email}
                                            helperText={errors.email?.message}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField fullWidth label="Mobile Phone" {...register('phone_mobile')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField fullWidth label="Office Phone" {...register('phone_office')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <TextField fullWidth label="Other Phone" {...register('phone_other')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>
                                </Grid>

                                {/* SECTION 3: ADDRESS */}
                                <Typography variant="h6" sx={{ mt: 4, mb: 2, color: 'primary.main' }}>Address</Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField fullWidth label="Street Line 1" {...register('street_l1')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField fullWidth label="Street Line 2" {...register('street_l2')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField fullWidth label="Street Line 3" {...register('street_l3')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>

                                    <Grid size={{ xs: 6, md: 4 }}>
                                        <TextField fullWidth label="Postcode" {...register('postcode')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>
                                    <Grid size={{ xs: 6, md: 8 }}>
                                        <TextField fullWidth label="City" {...register('city')} slotProps={{ inputLabel: { shrink: true } }} />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Controller
                                            name="country"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} select fullWidth label="Country" slotProps={{ inputLabel: { shrink: true } }}>
                                                    {Object.values(Country).map((c) => (
                                                        <MenuItem key={c} value={c}>
                                                            {getCountryLabel(c)}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        {selectedCountry === Country.MALAYSIA ? (
                                            <Controller
                                                name="state"
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField {...field} select fullWidth label="State (Malaysia)" slotProps={{ inputLabel: { shrink: true } }}>
                                                        {Object.values(MalaysiaState).map((st) => (
                                                            <MenuItem key={st} value={st}>
                                                                {MalaysiaStateLabels[st]}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>
                                                )}
                                            />
                                        ) : (
                                            <TextField fullWidth label="State / Province" {...register('state')} slotProps={{ inputLabel: { shrink: true } }} />
                                        )}
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
                                        {loading ? 'Saving...' : 'Save Developer'}
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

export default DeveloperForm;