package com.codesolutions.pmt_backend.Entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class EnumTest {

    @Test
    void testTaskStatusEnumValues() {
        assertNotNull(TaskStatusEnum.valueOf("TODO"));
        assertNotNull(TaskStatusEnum.valueOf("IN_PROGRESS"));
        assertNotNull(TaskStatusEnum.valueOf("DONE"));

        for (TaskStatusEnum e : TaskStatusEnum.values()) {
            assertNotNull(e.name());
        }
    }

    @Test
    void testTaskPriorityEnumValues() {
        assertNotNull(TaskPriorityEnum.valueOf("LOW"));
        assertNotNull(TaskPriorityEnum.valueOf("MEDIUM"));
        assertNotNull(TaskPriorityEnum.valueOf("HIGH"));

        for (TaskPriorityEnum e : TaskPriorityEnum.values()) {
            assertNotNull(e.name());
        }
    }

    @Test
    void testRoleEnumValuesIfPresent() {
        // RoleEnum existe dans tes sources, on le valide aussi
        assertNotNull(RoleEnum.valueOf("ADMIN"));
        assertNotNull(RoleEnum.valueOf("MEMBER"));
        assertNotNull(RoleEnum.valueOf("OBSERVER"));

        for (RoleEnum e : RoleEnum.values()) {
            assertNotNull(e.name());
        }
    }
}
