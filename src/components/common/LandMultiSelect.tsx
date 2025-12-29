import React, { useEffect, useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { 
    TextField, MenuItem, CircularProgress, Box, Typography, Chip 
} from '@mui/material';
import { LandService } from '../../services/land';

interface LandMultiSelectProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
}

export const LandMultiSelect = <T extends FieldValues>({
    control,
    name,
    label = "Assign Lands",
    error,
    helperText,
    disabled = false
}: LandMultiSelectProps<T>) => {
    const [lands, setLands] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        
        // Fetch ALL lands for the dropdown
        LandService.getAll({ 
            sort: 'lot', 
            direction: 'asc',
            get_all: true // <--- Triggers full list fetch
        })
        .then((res: any) => {
            if (mounted) {
                setLands(res.data || []);
            }
        })
        .catch(err => console.error("Failed to load lands", err))
        .finally(() => {
            if (mounted) setLoading(false);
        });

        return () => { mounted = false; };
    }, []);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <TextField
                    {...field}
                    select
                    fullWidth
                    label={label}
                    error={error}
                    helperText={helperText}
                    disabled={disabled}
                    slotProps={{
                        inputLabel: { shrink: true },
                        select: {
                            multiple: true, // Enable Multi-Select
                            renderValue: (selected: any) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(selected as number[]).map((value) => {
                                        const land = lands.find(l => l.id === value);
                                        return (
                                            <Chip 
                                                key={value} 
                                                label={land ? `Lot ${land.lot}` : value} 
                                                size="small" 
                                            />
                                        );
                                    })}
                                </Box>
                            )
                        },
                        input: {
                            endAdornment: loading ? (
                                <CircularProgress size={20} color="inherit" sx={{ mr: 4 }} />
                            ) : null
                        }
                    }}
                >
                    {lands.map((land) => (
                        <MenuItem key={land.id} value={land.id}>
                            Lot {land.lot} 
                            {land.town ? ` - ${land.town}` : ''}
                        </MenuItem>
                    ))}
                    
                    {!loading && lands.length === 0 && (
                        <MenuItem disabled>No lands available</MenuItem>
                    )}
                </TextField>
            )}
        />
    );
};