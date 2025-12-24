import React, { useEffect, useState } from 'react';
import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { 
    TextField, MenuItem, CircularProgress, Box, Typography 
} from '@mui/material'; // <--- Added Box, Typography
import { DeveloperService, Developer } from '../../services/developer';

interface DeveloperSelectProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label?: string;
    rules?: RegisterOptions<T>;
    required?: boolean;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
}

export const DeveloperSelect = <T extends FieldValues>({
    control,
    name,
    label = "Assign to Developer",
    rules,
    required = false,
    error,
    helperText,
    disabled = false,
}: DeveloperSelectProps<T>) => {
    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        DeveloperService.getAll({ get_all: 1, sort: 'name', direction: 'asc' })
            .then((res: any) => {
                if (mounted) {
                    setDevelopers(res.data || []);
                }
            })
            .catch(err => console.error("Failed to load developers", err))
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, []);

    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field }) => (
                <TextField
                    {...field}
                    select
                    fullWidth
                    label={label}
                    required={required}
                    error={error}
                    helperText={helperText}
                    disabled={disabled}
                    // 1. Ensure the INPUT only shows the Name (not the subtext)
                    // SelectProps={{
                    //     renderValue: (selected: any) => {
                    //         if (!selected) return '';
                    //         const dev = developers.find(d => d.id === selected);
                    //         return dev ? dev.name : selected;
                    //     }
                    // }}
                    slotProps={{
                        inputLabel: { shrink: true },
                        select: {
                            renderValue: (selected: any) => {
                                if (!selected) return '';
                                const dev = developers.find(d => d.id === selected);
                                return dev ? dev.name : selected;
                            }
                        },
                        input: {
                            endAdornment: loading ? (
                                <CircularProgress size={20} color="inherit" sx={{ mr: 4 }} />
                            ) : null
                        }
                    }}
                >
                    {developers.map((dev) => (
                        <MenuItem key={dev.id} value={dev.id}>
                            {/* 2. Custom Layout for the Dropdown Item */}
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body1">
                                    {dev.name}
                                </Typography>
                                {dev.license_no && (
                                    <Typography variant="caption" color="text.secondary">
                                        {dev.license_no}
                                    </Typography>
                                )}
                            </Box>
                        </MenuItem>
                    ))}
                    
                    {!loading && developers.length === 0 && (
                        <MenuItem disabled>No developers found</MenuItem>
                    )}
                </TextField>
            )}
        />
    );
};