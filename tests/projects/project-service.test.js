const ProjectService = require('../../src/projects/project-service');
const fs = require('fs');
const path = require('path');

describe('ProjectService', () => {
    let service;
    const testDataPath = path.join(__dirname, 'test-projects.json');

    beforeEach(() => {
        // Clean up test file before each test
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
        service = new ProjectService({ dataPath: testDataPath });
    });

    afterAll(() => {
        // Clean up after all tests
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
    });

    describe('getProject', () => {
        it('returns null for unknown project', () => {
            expect(service.getProject('Unknown Project')).toBeNull();
        });

        it('finds project by exact name', async () => {
            await service.addProject({ name: 'Project Alpha', description: 'Test project' });
            const project = service.getProject('Project Alpha');
            expect(project).not.toBeNull();
            expect(project.name).toBe('Project Alpha');
        });

        it('finds project by alias', async () => {
            await service.addProject({
                name: 'Project Alpha',
                aliases: ['Alpha', 'PA'],
                description: 'Test project'
            });
            const project = service.getProject('Alpha');
            expect(project).not.toBeNull();
            expect(project.name).toBe('Project Alpha');
        });

        it('is case-insensitive', async () => {
            await service.addProject({ name: 'Project Alpha', description: 'test' });
            expect(service.getProject('project alpha')).not.toBeNull();
            expect(service.getProject('PROJECT ALPHA')).not.toBeNull();
        });
    });

    describe('addProject', () => {
        it('creates a new project with basic fields', async () => {
            const project = await service.addProject({
                name: 'Project Beta',
                description: 'A beta test project'
            });

            expect(project.id).toBe('project-beta');
            expect(project.name).toBe('Project Beta');
            expect(project.description).toBe('A beta test project');
            expect(project.created_at).toBeDefined();
            expect(project.task_count).toBe(0);
        });

        it('throws error if project already exists', async () => {
            await service.addProject({ name: 'Project Alpha', description: 'test' });
            await expect(service.addProject({ name: 'Project Alpha', description: 'test2' }))
                .rejects.toThrow('already exists');
        });

        it('removes project from pending after adding', async () => {
            service.markAsPending('Project Alpha', 'Submit report');
            expect(service.getPendingProjects().length).toBe(1);

            await service.addProject({ name: 'Project Alpha', description: 'Annual audit' });
            expect(service.getPendingProjects().length).toBe(0);
        });
    });

    describe('updateProject', () => {
        it('updates existing project fields', async () => {
            const project = await service.addProject({ name: 'Project Alpha', description: 'old' });
            const updated = await service.updateProject(project.id, { description: 'new description' });

            expect(updated.description).toBe('new description');
            expect(updated.updated_at).toBeDefined();
        });

        it('throws error for non-existent project', async () => {
            await expect(service.updateProject('non-existent', { description: 'test' }))
                .rejects.toThrow('not found');
        });
    });

    describe('markAsPending', () => {
        it('adds new project to pending list', () => {
            const result = service.markAsPending('New Project', 'Task context');
            expect(result).toBe(true);

            const pending = service.getPendingProjects();
            expect(pending.length).toBe(1);
            expect(pending[0].name).toBe('New Project');
            expect(pending[0].mentions).toBe(1);
        });

        it('increments mentions for existing pending project', () => {
            service.markAsPending('Project Alpha', 'Task 1');
            service.markAsPending('Project Alpha', 'Task 2');

            const pending = service.getPendingProjects();
            expect(pending.length).toBe(1);
            expect(pending[0].mentions).toBe(2);
        });

        it('returns false for known project (not pending)', async () => {
            await service.addProject({ name: 'Project Alpha', description: 'known' });
            const result = service.markAsPending('Project Alpha', 'some task');
            expect(result).toBe(false);
        });

        it('skips generic category names', () => {
            expect(service.markAsPending('Work', 'some task')).toBe(false);
            expect(service.markAsPending('Personal', 'some task')).toBe(false);
            expect(service.markAsPending('Shopping', 'some task')).toBe(false);
        });

        it('stores context of mentions', () => {
            service.markAsPending('Project Alpha', 'Submit report');
            service.markAsPending('Project Alpha', 'Get approval');

            const pending = service.getPendingProjects();
            expect(pending[0].contexts).toContain('Submit report');
            expect(pending[0].contexts).toContain('Get approval');
        });
    });

    describe('incrementTaskCount', () => {
        it('increments task count for known project', async () => {
            await service.addProject({ name: 'Project Alpha', description: 'test' });
            service.incrementTaskCount('Project Alpha');
            service.incrementTaskCount('Project Alpha');

            const project = service.getProject('Project Alpha');
            expect(project.task_count).toBe(2);
        });

        it('does nothing for unknown project', () => {
            // Should not throw
            service.incrementTaskCount('Unknown');
        });
    });

    describe('getStats', () => {
        it('returns correct stats', async () => {
            await service.addProject({
                name: 'Active Project',
                description: 'test',
                metadata: { status: 'active' }
            });
            await service.addProject({
                name: 'Paused Project',
                description: 'test',
                metadata: { status: 'paused' }
            });
            service.markAsPending('Unknown Project', 'context');

            const stats = service.getStats();
            expect(stats.total).toBe(2);
            expect(stats.active).toBeGreaterThanOrEqual(0);
            expect(stats.pending).toBe(1);
        });
    });

    describe('listProjects', () => {
        it('returns empty array initially', () => {
            expect(service.listProjects()).toEqual([]);
        });

        it('returns all added projects', async () => {
            await service.addProject({ name: 'Project A', description: 'a' });
            await service.addProject({ name: 'Project B', description: 'b' });

            const projects = service.listProjects();
            expect(projects.length).toBe(2);
        });
    });

    describe('exists', () => {
        it('returns false for unknown project', () => {
            expect(service.exists('Unknown')).toBe(false);
        });

        it('returns true for known project', async () => {
            await service.addProject({ name: 'Project Alpha', description: 'test' });
            expect(service.exists('Project Alpha')).toBe(true);
        });
    });
});
