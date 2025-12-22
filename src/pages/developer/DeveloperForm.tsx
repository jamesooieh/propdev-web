import React, { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { DeveloperService } from '../../services/developer';

// Import Enums and Labels
import { 
    DeveloperStatus, DeveloperStatusLabels, 
    Country, CountryLabels, 
    MalaysiaState, MalaysiaStateLabels 
} from '../../enums';

// MUI Imports (MUI 6/7)
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
        status: DeveloperStatus.ACTIVE, // Default 'A'
        reg_no: '',
        license_no: '',
        contact_person: '',
        email: '',
        phone_mobile: '',
        phone_office: '',
        street_l1: '',
        street_l2: '',
        city: '',
        postcode: '',
        state: '',
        country: Country.MALAYSIA // Default 'MY'
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
                // Ensure Enums match (cast string to Enum if needed)
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
            // Laravel Validation Error
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
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
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
                    
                    {/* MUI 6 Grid Syntax */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <TextField fullWidth label="Company Name" error={!!errors.name} helperText={errors.name?.message}
                                {...register('name', { required: 'Name is required' })}
                            />
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Controller
                                name="status"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <TextField {...field} select fullWidth label="Status">
                                        {Object.values(DeveloperStatus).map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {/* Value is 'A', Label is 'Active' */}
                                                {DeveloperStatusLabels[status]}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Registration No" {...register('reg_no')} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="License No" {...register('license_no')} />
                        </Grid>
                    </Grid>

                    {/* SECTION 2: CONTACT */}
                    <Typography variant="h6" sx={{ mt: 4, mb: 2, color: 'primary.main' }}>Contact Info</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Contact Person" {...register('contact_person')} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Email" type="email" {...register('email')} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Mobile Phone" {...register('phone_mobile')} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth label="Office Phone" {...register('phone_office')} />
                        </Grid>
                    </Grid>

                    {/* SECTION 3: ADDRESS */}
                    <Typography variant="h6" sx={{ mt: 4, mb: 2, color: 'primary.main' }}>Address</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Street Line 1" {...register('street_l1')} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField fullWidth label="Street Line 2" {...register('street_l2')} />
                        </Grid>
                        
                        <Grid size={{ xs: 6, md: 4 }}>
                            <TextField fullWidth label="Postcode" {...register('postcode')} />
                        </Grid>
                        <Grid size={{ xs: 6, md: 8 }}>
                            <TextField fullWidth label="City" {...register('city')} />
                        </Grid>

                        {/* Country Selection */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="country"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select fullWidth label="Country">
                                        {Object.values(Country).map((c) => (
                                            <MenuItem key={c} value={c}>
                                                {CountryLabels[c]}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Dynamic State Selection */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            {selectedCountry === Country.MALAYSIA ? (
                                <Controller
                                    name="state"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} select fullWidth label="State (Malaysia)">
                                            {Object.values(MalaysiaState).map((st) => (
                                                <MenuItem key={st} value={st}>
                                                    {/* Value: '01', Label: 'Johor' */}
                                                    {MalaysiaStateLabels[st]}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            ) : (
                                <TextField fullWidth label="State / Province" {...register('state')} />
                            )}
                        </Grid>
                    </Grid>

                    {/* ACTIONS */}
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            size="large" 
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <Save />}
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