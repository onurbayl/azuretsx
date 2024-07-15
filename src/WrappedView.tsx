import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { loginRequest } from './auth-config';
import React, { useState, useEffect } from 'react';
import client from 'axios';

interface User {
    id: string;
    displayName: string;
    mail?: string;
    userPrincipalName: string;
}

const WrappedView: React.FC = () => {
    const { instance, accounts } = useMsal();
    const [currentUserData, setCurrentUserData] = useState<User | null>(null);
    const [allUserData, setAllUserData] = useState<User[]>([]);
    const [loadingCurrentUser, setLoadingCurrentUser] = useState<boolean>(true);
    const [loadingAllUsers, setLoadingAllUsers] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const handleRedirect = () => {
        instance.loginRedirect({
            ...loginRequest,
            prompt: 'select_account',
        }).catch((error) => console.log(error));
    };

    const handleLogout = () => instance.logout();

    useEffect(() => {
        const fetchData = async () => {
            if (accounts.length > 0) {
                const account = accounts[0];

                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: account,
                    });

                    // Fetch current user data
                    try {
                        const userRes = await client.get<User>('https://graph.microsoft.com/v1.0/me', {
                            headers: {
                                Authorization: `Bearer ${response.accessToken}`,
                            },
                        });
                        setCurrentUserData(userRes.data);
                        setLoadingCurrentUser(false);
                    } catch (error) {
                        console.error(error);
                        setLoadingCurrentUser(false);
                        setError('Failed to fetch current user data');
                    }

                    // Fetch access token for backend API
                    try {
                        const allUsersRes = await client.post<{ value: User[] }>('http://localhost:8080/api/v1/auth/users', {
                            client_id: "c132c4d6-8e26-47dc-a612-3adbcc833b2a",
                            scope: "https://graph.microsoft.com/.default",
                            client_secret: "Qh38Q~aMYRnJqcFm.zUrzYZxh4GKcytbsdQ~taK1",
                            tenant_id: "04be5fbc-9a03-4766-9bed-0b63fa21d707",
                        });

                        const allUsersData = allUsersRes.data;
                        setAllUserData(allUsersData.value || []); // Ensure data.value is an array
                        setLoadingAllUsers(false);
                    } catch (error) {
                        console.error(error);
                        setLoadingAllUsers(false);
                        setError('Failed to fetch all users data');
                    }
                } catch (error) {
                    console.error(error);
                    instance.acquireTokenRedirect(loginRequest);
                }
            }
        };

        fetchData();
    }, [instance, accounts]);

    return (
        <div className="App">
            <AuthenticatedTemplate>
                {loadingCurrentUser ? (
                    <p>Loading current user data...</p>
                ) : (
                    currentUserData && (
                        <div>
                            <h2>Authenticated Successfully</h2>
                            <p>ID: {currentUserData.id}</p>
                            <p>Name: {currentUserData.displayName}</p>
                            <p>Email: {currentUserData.mail || currentUserData.userPrincipalName}</p>
                            <button type="button" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    )
                )}
                {loadingAllUsers ? (
                    <p>Loading all users data...</p>
                ) : (
                    <div>
                        <h3>All Users:</h3>
                        <ul>
                            {allUserData.map((user) => (
                                <li key={user.id}>
                                    {user.displayName} - {user.mail || user.userPrincipalName}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {error && <p>{error}</p>}
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <button onClick={handleRedirect}>Sign Up</button>
            </UnauthenticatedTemplate>
        </div>
    );
};

export default WrappedView