import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const NotFoundComponent = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <motion.h1 
                className="text-6xl font-bold text-gray-800 mb-4"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                404
            </motion.h1>
            <motion.p
                className="text-xl text-gray-600 mb-8"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                Oops! The page you are looking for does not exist.
            </motion.p>
            <Link to="/">
                <Button>
                    Go Back Home
                </Button>
            </Link>
        </div>
    );
};

export default NotFoundComponent;
