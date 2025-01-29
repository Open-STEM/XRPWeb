import { describe, it, expect, vi } from 'vitest';
import FilesysMgr from '../filesysmgr';
import AppMgr, { EventType } from '@/managers/appmgr';
import treeData from '@/utils/testdata';

describe('FilesysMgr', () => {
    it('should emit EVENT_FILESYS event with treeData after start is called', () => {
        const appMgrInstance = AppMgr.getInstance();
        const emitSpy = vi.spyOn(appMgrInstance, 'emit');
        const filesysMgr = new FilesysMgr();

        filesysMgr.start();

        setTimeout(() => {
            expect(emitSpy).toHaveBeenCalledWith(EventType.EVENT_FILESYS, JSON.stringify(treeData));
        }, 10000);
    });
});
