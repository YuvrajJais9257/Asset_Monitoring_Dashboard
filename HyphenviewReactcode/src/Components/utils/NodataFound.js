import { Typography, Box, Stack } from '@mui/material';
import React from 'react';
import WarningIcon from '@mui/icons-material/Warning';

export default function NodataFound() {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh', 
                textAlign: 'center'
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <WarningIcon sx={{ height: '100px', width: '100px' }} />
                <Box>
                    <Typography variant='h4'>Page not found</Typography>
                    <Typography variant='h6'>We're sorry, we couldn't find the page you requested.</Typography>
                </Box>
            </Stack>
        </Box>
    );
}
