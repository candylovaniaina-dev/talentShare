import api from "./api";

const universityService = {
    // ─── Universités ────────────────────────────────
    async list(params = {}) {
        const response = await api.get("/universities", { params });
        return response.data;
    },

    async show(id) {
        const response = await api.get(`/universities/${id}`);
        return response.data;
    },

    async create(data) {
        const response = await api.post("/universities", data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/universities/${id}`, data);
        return response.data;
    },

    async destroy(id) {
        const response = await api.delete(`/universities/${id}`);
        return response.data;
    },

    // ─── Facultés ───────────────────────────────────
    async listFaculties(universityId) {
        const response = await api.get(`/universities/${universityId}/faculties`);
        return response.data;
    },

    // ─── Départements ───────────────────────────────
    async listDepartments(facultyId) {
        const response = await api.get(`/faculties/${facultyId}/departments`);
        return response.data;
    },

    // ─── Programmes ─────────────────────────────────
    async listPrograms(departmentId) {
        const response = await api.get(`/departments/${departmentId}/programs`);
        return response.data;
    },
        // ─── Étudiants ──────────────────────────────────
    async listStudents(universityId, params = {}) {
        const response = await api.get(`/universities/${universityId}/students`, { params });
        return response.data;
    },

    async listPendingStudents(universityId) {
        const response = await api.get(`/universities/${universityId}/students/pending`);
        return response.data;
    },

    async getStudentStats(universityId) {
        const response = await api.get(`/universities/${universityId}/students/stats`);
        return response.data;
    },

    async approveStudent(universityId, studentId) {
        const response = await api.post(`/universities/${universityId}/students/${studentId}/approve`);
        return response.data;
    },

    async rejectStudent(universityId, studentId) {
        const response = await api.post(`/universities/${universityId}/students/${studentId}/reject`);
        return response.data;
    },

    async removeStudent(universityId, studentId) {
        const response = await api.delete(`/universities/${universityId}/students/${studentId}`);
        return response.data;
    },
    
        async getMyUniversities() {
        const response = await api.get("/my-universities");
        return response.data;
    },
};

export default universityService;