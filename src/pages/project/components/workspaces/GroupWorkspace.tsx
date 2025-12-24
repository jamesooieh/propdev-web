import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Tabs, Tab } from '@mui/material';
import { Add } from '@mui/icons-material';

interface GroupWorkspaceProps {
    groupId: string;
    groupTitle?: string;
    onUpdate: () => void;
}

const GroupWorkspace: React.FC<GroupWorkspaceProps> = ({ groupId, groupTitle }) => {
    const [tabValue, setTabValue] = useState(0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                    <Typography variant="caption" color="textSecondary">Group Detail</Typography>
                    <Typography variant="h5">{groupTitle}</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />}>Add Inventory</Button>
            </Box>

            <Paper sx={{ width: '100%', mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} indicatorColor="primary" textColor="primary">
                    <Tab label="Inventory List" />
                    <Tab label="Pricing Configuration" />
                </Tabs>
            </Paper>

            {tabValue === 0 && (
                <Paper sx={{ p: 3, minHeight: 400 }}>
                    <Typography variant="h6">Inventory Table</Typography>
                    <Typography color="textSecondary" sx={{ mt: 2 }}>
                        Here you will load the data table for Group ID: <strong>{groupId}</strong>
                    </Typography>
                </Paper>
            )}

            {tabValue === 1 && (
                <Paper sx={{ p: 3, minHeight: 400 }}>
                    <Typography variant="h6">Pricing Logic</Typography>
                    <Typography color="textSecondary" sx={{ mt: 2 }}>
                        Configuration form for pricing rules goes here.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default GroupWorkspace;