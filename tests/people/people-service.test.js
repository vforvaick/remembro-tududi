const PeopleService = require('../../src/people/people-service');
const fs = require('fs');
const path = require('path');

describe('PeopleService', () => {
    let service;
    const testDataPath = path.join(__dirname, 'test-people.json');

    beforeEach(() => {
        // Clean up test file before each test
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
        service = new PeopleService({ dataPath: testDataPath });
    });

    afterAll(() => {
        // Clean up after all tests
        if (fs.existsSync(testDataPath)) {
            fs.unlinkSync(testDataPath);
        }
    });

    describe('getPerson', () => {
        it('returns null for unknown person', () => {
            expect(service.getPerson('Unknown Name')).toBeNull();
        });

        it('finds person by exact name', async () => {
            await service.addPerson({ name: 'Pak Ekgik', description: 'Department head' });
            const person = service.getPerson('Pak Ekgik');
            expect(person).not.toBeNull();
            expect(person.name).toBe('Pak Ekgik');
        });

        it('finds person by alias', async () => {
            await service.addPerson({
                name: 'Pak Ekgik',
                aliases: ['Bapak Ekgik', 'Mr Ekgik'],
                description: 'Department head'
            });
            const person = service.getPerson('Bapak Ekgik');
            expect(person).not.toBeNull();
            expect(person.name).toBe('Pak Ekgik');
        });

        it('is case-insensitive', async () => {
            await service.addPerson({ name: 'Pak Ekgik', description: 'test' });
            expect(service.getPerson('pak ekgik')).not.toBeNull();
            expect(service.getPerson('PAK EKGIK')).not.toBeNull();
        });
    });

    describe('addPerson', () => {
        it('creates a new person with basic fields', async () => {
            const person = await service.addPerson({
                name: 'Mas Afan',
                description: 'Team lead, my direct supervisor'
            });

            expect(person.id).toBe('mas-afan');
            expect(person.name).toBe('Mas Afan');
            expect(person.description).toBe('Team lead, my direct supervisor');
            expect(person.created_at).toBeDefined();
            expect(person.task_count).toBe(0);
        });

        it('throws error if person already exists', async () => {
            await service.addPerson({ name: 'Pak Ekgik', description: 'test' });
            await expect(service.addPerson({ name: 'Pak Ekgik', description: 'test2' }))
                .rejects.toThrow('already exists');
        });

        it('removes person from pending after adding', async () => {
            service.markAsPending('Pak Ekgik', 'Submit report');
            expect(service.getPendingPeople().length).toBe(1);

            await service.addPerson({ name: 'Pak Ekgik', description: 'Department head' });
            expect(service.getPendingPeople().length).toBe(0);
        });
    });

    describe('updatePerson', () => {
        it('updates existing person fields', async () => {
            const person = await service.addPerson({ name: 'Pak Ekgik', description: 'old' });
            const updated = await service.updatePerson(person.id, { description: 'new description' });

            expect(updated.description).toBe('new description');
            expect(updated.updated_at).toBeDefined();
        });

        it('throws error for non-existent person', async () => {
            await expect(service.updatePerson('non-existent', { description: 'test' }))
                .rejects.toThrow('not found');
        });
    });

    describe('markAsPending', () => {
        it('adds new person to pending list', () => {
            const result = service.markAsPending('New Person', 'Task context');
            expect(result).toBe(true);

            const pending = service.getPendingPeople();
            expect(pending.length).toBe(1);
            expect(pending[0].name).toBe('New Person');
            expect(pending[0].mentions).toBe(1);
        });

        it('increments mentions for existing pending person', () => {
            service.markAsPending('Pak Ekgik', 'Task 1');
            service.markAsPending('Pak Ekgik', 'Task 2');

            const pending = service.getPendingPeople();
            expect(pending.length).toBe(1);
            expect(pending[0].mentions).toBe(2);
        });

        it('returns false for known person (not pending)', async () => {
            await service.addPerson({ name: 'Pak Ekgik', description: 'known' });
            const result = service.markAsPending('Pak Ekgik', 'some task');
            expect(result).toBe(false);
        });

        it('stores context of mentions', () => {
            service.markAsPending('Pak Ekgik', 'Submit report');
            service.markAsPending('Pak Ekgik', 'Get signature');

            const pending = service.getPendingPeople();
            expect(pending[0].contexts).toContain('Submit report');
            expect(pending[0].contexts).toContain('Get signature');
        });
    });

    describe('incrementTaskCount', () => {
        it('increments task count for known person', async () => {
            await service.addPerson({ name: 'Pak Ekgik', description: 'test' });
            service.incrementTaskCount('Pak Ekgik');
            service.incrementTaskCount('Pak Ekgik');

            const person = service.getPerson('Pak Ekgik');
            expect(person.task_count).toBe(2);
        });

        it('does nothing for unknown person', () => {
            // Should not throw
            service.incrementTaskCount('Unknown');
        });
    });

    describe('listPeople', () => {
        it('returns empty array initially', () => {
            expect(service.listPeople()).toEqual([]);
        });

        it('returns all added people', async () => {
            await service.addPerson({ name: 'Person A', description: 'a' });
            await service.addPerson({ name: 'Person B', description: 'b' });

            const people = service.listPeople();
            expect(people.length).toBe(2);
        });
    });

    describe('exists', () => {
        it('returns false for unknown person', () => {
            expect(service.exists('Unknown')).toBe(false);
        });

        it('returns true for known person', async () => {
            await service.addPerson({ name: 'Pak Ekgik', description: 'test' });
            expect(service.exists('Pak Ekgik')).toBe(true);
        });
    });
});
