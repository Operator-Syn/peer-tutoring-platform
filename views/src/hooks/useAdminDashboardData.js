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
    const [reportedFilter, setReportedFilter] = useState('all');

    const setStatusFilterWithReset = (value) => {
        setStatusFilter(value);
        setPage(1);
    };

    const setSearchWithReset = (value) => {
        setSearch(value);
        setPage(1);
    };

    const setSortByWithReset = (value) => {
        setSortBy(value);
        setPage(1);
    };

    const setYearFilterWithReset = (value) => {
        setYearFilter(value);
        setPage(1);
    };

    const setRoleFilterWithReset = (value) => {
        setRoleFilter(value);
        setPage(1);
    };

    const setReportedFilterWithReset = (value) => {
        setReportedFilter(value);
        setPage(1);
    };

    const setActiveTab = (newTab) => {
        if (newTab === activeTab) return;
        setActiveTabState(newTab);
        
        setStatusFilter('all');
        setSearch('');
        setSortBy('date_desc');
        setCollegeFilter('all');
        setYearFilter('all');
        setRoleFilter('all');
        setReportedFilter('all');
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
                params.append('reported', reportedFilter);
            } else if (activeTab === 'appeals') {
                endpoint = '/api/appeals/all';
            } else if (activeTab === 'requests') {
                endpoint = '/api/admin/subject-requests';
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
    }, [activeTab, page, limit, search, statusFilter, sortBy, collegeFilter, yearFilter, roleFilter, reportedFilter]);

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
            if (actionType === 'RESOLVE_REQUEST') {
                url = `/api/admin/subject-requests/${id}/resolve`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(actionType === 'UPDATE_USER_STATUS' ? { google_id: id, ...payload } : payload)
            });

            const result = await res.json().catch(() => ({}));

            if (res.ok && result.success !== false) {
                fetchData();
                fetchStatistics();
                return { success: true, message: result.message };
            } else {
                return { success: false, message: result.error || result.message || 'Action failed' };
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
            search, setSearch: setSearchWithReset,
            status: statusFilter, setStatus: setStatusFilterWithReset,
            sort: sortBy, setSort: setSortByWithReset,
            college: collegeFilter, setCollege: setCollegeFilter,
            year: yearFilter, setYear: setYearFilterWithReset,
            role: roleFilter, setRole: setRoleFilterWithReset,
            reported: reportedFilter, setReported: setReportedFilterWithReset
        },
        pagination,
        actions: { handleAction, refresh: fetchData }
    };
};