import { useState, useEffect, useCallback } from 'react';

export const useAdminDashboardData = () => {
    const [activeTab, setActiveTabState] = useState('applications');
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date_desc');
    const [pagination, setPagination] = useState({ total_pages: 1, current_page: 1 });
    
    const [collegeFilter, setCollegeFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');

    const setActiveTab = (newTab) => {
        if (newTab === activeTab) return;
        setActiveTabState(newTab);
        
        setStatusFilter('all');
        setSearch('');
        setSortBy('date_desc');
        setCollegeFilter('all');
        setYearFilter('all');
        setRoleFilter('all');
        setPage(1);
        setLoading(true);
    };

    const fetchStatistics = useCallback(async () => {
        try {
            const res = await fetch('/api/tutor-applications/admin/statistics');
            const json = await res.json();
            if (json.statistics) setStats(json.statistics);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page,
                limit,
                search,
                status: statusFilter,
                sort_by: sortBy,
            });

            let endpoint = '';
            
            if (activeTab === 'applications') {
                endpoint = '/api/tutor-applications/admin/applications';
                params.append('college', collegeFilter);
                params.append('year', yearFilter);
            } else if (activeTab === 'users') {
                endpoint = '/api/tutor-applications/admin/users';
                params.append('role', roleFilter);
            } else if (activeTab === 'appeals') {
                endpoint = '/api/appeals/all';
            }

            const response = await fetch(`${endpoint}?${params.toString()}`);
            const result = await response.json();

            if (result.success !== false) {
                const fetchedData = result.data || result.users || result.appeals || result.applications || [];
                setData(fetchedData);
                setPagination(result.pagination || { total_pages: 1, current_page: 1 });
            } else {
                setError(result.error || "Failed to load data");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, limit, search, statusFilter, sortBy, collegeFilter, yearFilter, roleFilter]);

    useEffect(() => {
        fetchData();
        fetchStatistics();
    }, [fetchData, fetchStatistics]);

    const handleAction = async (actionType, id, payload = {}) => {
        try {
            let url = '';
            let method = 'POST';
            
            if (actionType === 'APPROVE_APP') url = `/api/tutor-applications/admin/applications/${id}/approve`;
            if (actionType === 'REJECT_APP') url = `/api/tutor-applications/admin/applications/${id}/reject`;
            if (actionType === 'UPDATE_USER_STATUS') {
                url = `/api/tutor-applications/admin/users/status`;
                method = 'PUT';
            }
            if (actionType === 'RESOLVE_APPEAL') {
                url = `/api/appeals/resolve/${id}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(actionType === 'UPDATE_USER_STATUS' ? { google_id: id, ...payload } : payload)
            });

            if (res.ok) {
                fetchData();
                fetchStatistics();
                return { success: true };
            } else {
                return { success: false, message: "Action failed" };
            }
        } catch (e) {
            return { success: false, message: e.message };
        }
    };

    return {
        activeTab, 
        setActiveTab,
        data, stats, loading, error,
        filters: {
            page, setPage,
            limit, setLimit,
            search, setSearch,
            status: statusFilter, setStatus: setStatusFilter,
            sort: sortBy, setSort: setSortBy,
            college: collegeFilter, setCollege: setCollegeFilter,
            year: yearFilter, setYear: setYearFilter,
            role: roleFilter, setRole: setRoleFilter
        },
        pagination,
        actions: { handleAction, refresh: fetchData }
    };
};