import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilesysMgr from '@managers/filesysmgr';
import AppMgr, { EventType } from '@/managers/appmgr';
import treeData from '@/utils/testdata';

describe('FilesysMgr', () => {
    let filesysMgr: FilesysMgr;
    let appMgrInstance: AppMgr;
    let emitSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        appMgrInstance = AppMgr.getInstance();
        emitSpy = vi.spyOn(appMgrInstance, 'emit');
        filesysMgr = new FilesysMgr();
        vi.clearAllMocks(); // Clear mocks before each test
    });
    it('should emit EVENT_FILESYS event with treeData after start is called', () => {
        filesysMgr.start();

        setTimeout(() => {
            expect(emitSpy).toHaveBeenCalledWith(EventType.EVENT_FILESYS, JSON.stringify(treeData));
        }, 10000);
    });
});
