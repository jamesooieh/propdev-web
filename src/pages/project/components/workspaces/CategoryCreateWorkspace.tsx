import React from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Paper, Typography } from '@mui/material';
import { CategoryService } from '../../../../services/category';
import { CategoryStatus } from '../../../../enums';

interface CategoryCreateProps {
    projectId: string;
    onSuccess: () => void;
}

const CategoryCreateWorkspace: React.FC<CategoryCreateProps> = ({ projectId, onSuccess }) => {
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data: any) => {
        try {
            await CategoryService.create({
                project_id: projectId,
                title: data.title,
                status: CategoryStatus.ACTIVE
            });
            onSuccess();
        } catch (e) {
            console.error(e);
            alert("Failed to create category");
        }
    };

    return (
        <Box maxWidth="sm" mx="auto" mt={4}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" mb={3}>Create New Category</Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextField 
                        fullWidth 
                        label="Category Title" 
                        {...register('title', { required: 'Title is required' })}
                        error={!!errors.title}
                        helperText={errors.title?.message as string}
                        sx={{ mb: 3 }}
                    />
                    
                    <Button type="submit" variant="contained" size="large" fullWidth>
                        Create Category
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default CategoryCreateWorkspace;