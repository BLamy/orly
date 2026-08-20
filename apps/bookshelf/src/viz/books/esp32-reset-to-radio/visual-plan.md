# From Reset to Radio — visual plan

Source: `espressif/esp-idf` at `08e0d30a74ad0bfd5a34933142b80f45619ee410`.

Throughline: one packet cannot leave the antenna until the chip has built the
entire path beneath it.

## Chapter 1 — The boot conveyor

Grounding: `components/bootloader/subproject/main/bootloader_start.c`,
`components/esp_system/port/cpu_start.c`, `components/esp_system/startup.c`.

Persistent visual: a strip of flash is scanned, one partition is selected, and
its image segments are lifted into mapped instruction/data memory.

1. Reset lands in mask ROM; the flash/cache stage is still dark.
2. ROM loads the second-stage bootloader from flash.
3. `bootloader_init()` brings up enough hardware to read reliably.
4. `bootloader_utility_load_partition_table()` reveals factory/OTA slots.
5. `bootloader_utility_get_selected_boot_partition()` moves the selector.
6. `bootloader_utility_load_boot_image()` maps/loads the chosen image.
7. `call_start_cpu0()` clears BSS and initializes cache/MMU and external memory.
8. The selected image becomes executing application code.

## Chapter 2 — The scheduler loom

Grounding: `components/esp_system/port/cpu_start.c`,
`components/esp_system/startup.c`, `components/freertos/app_startup.c`,
`components/freertos/FreeRTOS-Kernel/tasks.c`.

Persistent visual: two core rails pull task cards from ready queues while a
tick cursor advances. Blocking turns a running card into space for another.

1. CPU zero performs shared early initialization while CPU one waits.
2. `system_early_init()` releases the other core into `call_start_cpu1()`.
3. `esp_startup_start_app()` creates the pinned `main` task.
4. `vTaskStartScheduler()` starts task selection on the cores.
5. Higher-priority ready work preempts lower-priority work.
6. Blocked tasks leave the rail; interrupts/events make them ready again.
7. `main_task()` calls the application's `app_main()`.
8. The application is one task among Wi-Fi, event, timer, and driver tasks.

## Chapter 3 — The interrupt handoff

Grounding: `components/esp_hw_support/intr_alloc.c`,
`components/esp_hw_support/include/esp_intr_alloc.h`,
`components/esp_driver_uart/src/uart.c`, `components/esp_event/esp_event.c`.

Persistent visual: UART bytes fill a FIFO, trip an interrupt threshold, cross
the interrupt allocator's routing matrix, drain through a short ISR, then wake
a task through a queue.

1. Peripheral bytes arrive independently of application code.
2. The UART FIFO absorbs the burst.
3. `esp_intr_alloc()` assigns a compatible CPU interrupt.
4. The threshold asserts the source and the matrix routes it to a core.
5. The ISR drains data and records only the minimum urgent work.
6. A queue handoff wakes a blocked consumer task.
7. `esp_event_post_to()` uses the same defer-work pattern for system events.
8. Short interrupts plus scheduled tasks keep the chip responsive.

## Chapter 4 — The packet elevator

Grounding: `components/esp_event/esp_event.c`,
`components/esp_wifi/src/wifi_default.c`,
`components/esp_netif/lwip/esp_netif_lwip.c`,
`components/esp_netif/lwip/netif/wlanif.c`,
`components/esp_wifi/include/esp_wifi.h`.

Persistent visual: one packet descends the lwIP → esp-netif → Wi-Fi stack to
the radio, then a reply climbs back up the same elevator.

1. The app creates the default event loop and station netif, then starts Wi-Fi.
2. Wi-Fi events are queued; the loop task dispatches registered handlers.
3. A station connection brings the interface up and starts DHCP.
4. The got-IP event marks the usable network boundary.
5. lwIP wraps outgoing bytes in a pbuf and calls `low_level_output()`.
6. `esp_netif_transmit_wrap()` hands the pbuf to the Wi-Fi driver.
7. Receive callbacks call `esp_netif_receive()` and feed lwIP's input function.
8. Pull back: boot, scheduling, interrupts, events, and networking all support
   the packet that finally reaches the antenna.
