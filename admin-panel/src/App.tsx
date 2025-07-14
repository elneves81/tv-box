
import React, { useState } from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import Login from './Login.tsx';

function App() {
  const [token, setToken] = useState<string | null>(null);

  if (!token) {
    return <Login onLogin={t => setToken(t)} />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          📺 Videos Box Admin
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          Sistema de Gerenciamento de TV Box
        </Typography>
        <Typography variant="body1" sx={{ mt: 3 }}>
          Bem-vindo ao painel!
        </Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setToken(null)}>Sair</Button>
      </Box>
    </Container>
  );
}

export default App;
