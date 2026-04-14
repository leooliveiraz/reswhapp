export API_URL=http://192.168.0.34:3000
export IMAGE_URL=http://192.168.0.34:3000/images
export SOCKET_URL=http://192.168.0.34:3000
cd Projects/reswhapp/frontend/
# Rode o Vite
nohup yarn dev --host > ~/log-frontend 2>&1 &
